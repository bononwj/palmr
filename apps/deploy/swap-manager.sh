#!/bin/bash

# Swap Manager Script
# 用于管理 Linux 系统的 swap 空间
# 使用方法: ./swap-manager.sh [command] [options]

set -e

# 设置编码为 UTF-8（确保中文显示正常）
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# 检测终端是否支持颜色
USE_COLOR=false
if [ -t 1 ]; then
    if command -v tput >/dev/null 2>&1; then
        if [ "$(tput colors 2>/dev/null)" -ge 8 ]; then
            USE_COLOR=true
        fi
    else
        # 如果没有 tput，检查 TERM 环境变量
        case "$TERM" in
            xterm*|rxvt*|screen*|linux|vt*|ansi)
                USE_COLOR=true
                ;;
        esac
    fi
fi

# 颜色定义（使用 $'...' 语法确保转义序列被正确解释）
if [ "$USE_COLOR" = true ]; then
    RED=$'\033[0;31m'
    GREEN=$'\033[0;32m'
    YELLOW=$'\033[1;33m'
    BLUE=$'\033[0;34m'
    NC=$'\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# 默认配置
SWAP_FILE="/swapfile"
SWAP_SIZE="2G"
SWAPPINESS=30
VFS_CACHE_PRESSURE=50

# 帮助信息
show_help() {
    printf "%b\n" "${BLUE}Swap Manager - Linux Swap 空间管理工具${NC}"
    printf "\n"
    printf "%b\n" "${GREEN}使用方法:${NC}"
    printf "    $0 [command] [options]\n"
    printf "\n"
    printf "%b\n" "${GREEN}命令列表:${NC}"
    printf "    ${YELLOW}create${NC} [size]     创建 swap 文件（默认: 2G）\n"
    printf "                             示例: $0 create 4G\n"
    printf "    ${YELLOW}on${NC}                启用 swap\n"
    printf "    ${YELLOW}off${NC}               禁用 swap\n"
    printf "    ${YELLOW}status${NC}            查看 swap 状态\n"
    printf "    ${YELLOW}setup${NC} [size]      一键设置（创建 + 启用 + 永久挂载）\n"
    printf "                             示例: $0 setup 4G\n"
    printf "    ${YELLOW}remove${NC}            删除 swap 文件和配置\n"
    printf "    ${YELLOW}config${NC}            配置 swap 优化参数（swappiness）\n"
    printf "\n"
    printf "%b\n" "${GREEN}示例:${NC}"
    printf "    $0 create 4G        # 创建 4GB swap 文件\n"
    printf "    $0 on              # 启用 swap\n"
    printf "    $0 off             # 禁用 swap\n"
    printf "    $0 status          # 查看状态\n"
    printf "    $0 setup 4G        # 一键设置 4GB swap\n"
    printf "    $0 remove          # 删除 swap\n"
    printf "\n"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}错误: 此脚本需要 root 权限${NC}"
        echo -e "请使用: ${YELLOW}sudo $0 $*${NC}"
        exit 1
    fi
}

# 显示 swap 状态
show_status() {
    echo -e "${BLUE}=== Swap 状态 ===${NC}"
    echo ""
    
    # 使用 free 命令显示内存和 swap
    echo -e "${GREEN}内存和 Swap 使用情况:${NC}"
    free -h
    echo ""
    
    # 显示 swap 详细信息
    echo -e "${GREEN}Swap 设备详情:${NC}"
    if swapon --show 2>/dev/null | grep -q .; then
        swapon --show
    else
        echo -e "${YELLOW}当前没有启用的 swap${NC}"
    fi
    echo ""
    
    # 显示 swap 使用统计
    echo -e "${GREEN}Swap 使用统计:${NC}"
    if [ -f /proc/swaps ]; then
        cat /proc/swaps
    fi
    echo ""
    
    # 显示 swappiness 设置
    echo -e "${GREEN}Swappiness 配置:${NC}"
    echo "当前值: $(cat /proc/sys/vm/swappiness)"
    echo "推荐值: 10-30 (服务器), 60 (桌面)"
    echo ""
    
    # 显示 vfs_cache_pressure
    echo -e "${GREEN}VFS Cache Pressure:${NC}"
    echo "当前值: $(cat /proc/sys/vm/vfs_cache_pressure)"
    echo ""
    
    # 检查 swap 文件是否存在
    if [ -f "$SWAP_FILE" ]; then
        echo -e "${GREEN}Swap 文件信息:${NC}"
        ls -lh "$SWAP_FILE"
    else
        echo -e "${YELLOW}Swap 文件不存在: $SWAP_FILE${NC}"
    fi
}

# 创建 swap 文件
create_swap() {
    local size=${1:-$SWAP_SIZE}
    
    check_root
    
    if [ -f "$SWAP_FILE" ]; then
        echo -e "${YELLOW}警告: Swap 文件已存在: $SWAP_FILE${NC}"
        read -p "是否删除并重新创建? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "操作已取消"
            exit 0
        fi
        # 如果 swap 正在使用，先关闭
        if swapon --show | grep -q "$SWAP_FILE"; then
            echo -e "${YELLOW}正在关闭 swap...${NC}"
            swapoff "$SWAP_FILE" 2>/dev/null || true
        fi
        rm -f "$SWAP_FILE"
    fi
    
    echo -e "${BLUE}正在创建 ${size} 的 swap 文件: $SWAP_FILE${NC}"
    
    # 检查磁盘空间
    local available=$(df -BG "$(dirname $SWAP_FILE)" | tail -1 | awk '{print $4}' | sed 's/G//')
    local required=$(echo "$size" | sed 's/G//')
    
    if [ "$available" -lt "$required" ]; then
        echo -e "${RED}错误: 磁盘空间不足 (需要: ${size}, 可用: ${available}G)${NC}"
        exit 1
    fi
    
    # 使用 fallocate 创建文件（更快）
    if command -v fallocate &> /dev/null; then
        fallocate -l "$size" "$SWAP_FILE"
    else
        # 如果 fallocate 不可用，使用 dd
        echo -e "${YELLOW}fallocate 不可用，使用 dd 创建（可能需要较长时间）...${NC}"
        dd if=/dev/zero of="$SWAP_FILE" bs=1M count=$(echo "$size" | sed 's/G//' | awk '{print $1*1024}') status=progress
    fi
    
    # 设置安全权限
    chmod 600 "$SWAP_FILE"
    
    # 格式化为 swap
    echo -e "${BLUE}正在格式化 swap 文件...${NC}"
    mkswap "$SWAP_FILE"
    
    echo -e "${GREEN}✓ Swap 文件创建成功: $SWAP_FILE (${size})${NC}"
}

# 启用 swap
enable_swap() {
    check_root
    
    if [ ! -f "$SWAP_FILE" ]; then
        echo -e "${RED}错误: Swap 文件不存在: $SWAP_FILE${NC}"
        echo -e "请先创建: ${YELLOW}$0 create${NC}"
        exit 1
    fi
    
    if swapon --show | grep -q "$SWAP_FILE"; then
        echo -e "${YELLOW}Swap 已经启用${NC}"
        show_status
        return
    fi
    
    echo -e "${BLUE}正在启用 swap...${NC}"
    swapon "$SWAP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Swap 已启用${NC}"
        show_status
    else
        echo -e "${RED}✗ 启用 swap 失败${NC}"
        exit 1
    fi
}

# 禁用 swap
disable_swap() {
    check_root
    
    if ! swapon --show | grep -q "$SWAP_FILE"; then
        echo -e "${YELLOW}Swap 未启用${NC}"
        return
    fi
    
    echo -e "${BLUE}正在禁用 swap...${NC}"
    swapoff "$SWAP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Swap 已禁用${NC}"
        show_status
    else
        echo -e "${RED}✗ 禁用 swap 失败${NC}"
        exit 1
    fi
}

# 配置永久挂载
setup_permanent() {
    check_root
    
    if [ ! -f "$SWAP_FILE" ]; then
        echo -e "${RED}错误: Swap 文件不存在: $SWAP_FILE${NC}"
        exit 1
    fi
    
    # 检查是否已经在 fstab 中
    if grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
        echo -e "${YELLOW}Swap 已配置为永久挂载${NC}"
        return
    fi
    
    echo -e "${BLUE}正在配置永久挂载...${NC}"
    
    # 备份 fstab
    cp /etc/fstab /etc/fstab.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}已备份 /etc/fstab${NC}"
    
    # 添加到 fstab
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    
    echo -e "${GREEN}✓ 已添加到 /etc/fstab${NC}"
    echo -e "${YELLOW}请验证配置是否正确:${NC}"
    grep "$SWAP_FILE" /etc/fstab
}

# 配置 swap 优化参数
config_swap() {
    check_root
    
    echo -e "${BLUE}正在配置 swap 优化参数...${NC}"
    
    # 创建配置文件
    local config_file="/etc/sysctl.d/99-swap.conf"
    
    # 备份现有配置
    if [ -f "$config_file" ]; then
        cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 写入配置
    cat > "$config_file" << EOF
# Swap optimization settings
# Generated by swap-manager.sh on $(date)

# Swappiness: 控制内核使用 swap 的倾向性
# 10-30: 适合服务器（优先使用物理内存）
# 60: 默认值（平衡）
# 100: 积极使用 swap
vm.swappiness=$SWAPPINESS

# VFS Cache Pressure: 控制内核回收目录和 inode 缓存的倾向性
# 50-100: 推荐值
vm.vfs_cache_pressure=$VFS_CACHE_PRESSURE
EOF
    
    # 应用配置
    sysctl -p "$config_file"
    
    echo -e "${GREEN}✓ Swap 优化参数已配置${NC}"
    echo -e "${BLUE}当前设置:${NC}"
    echo "  Swappiness: $(cat /proc/sys/vm/swappiness)"
    echo "  VFS Cache Pressure: $(cat /proc/sys/vm/vfs_cache_pressure)"
}

# 一键设置
setup_all() {
    local size=${1:-$SWAP_SIZE}
    
    check_root
    
    echo -e "${BLUE}=== 一键设置 Swap ===${NC}"
    echo ""
    
    # 1. 创建 swap 文件
    create_swap "$size"
    echo ""
    
    # 2. 启用 swap
    enable_swap
    echo ""
    
    # 3. 配置永久挂载
    setup_permanent
    echo ""
    
    # 4. 配置优化参数
    config_swap
    echo ""
    
    echo -e "${GREEN}=== 设置完成 ===${NC}"
    show_status
}

# 删除 swap
remove_swap() {
    check_root
    
    echo -e "${YELLOW}警告: 此操作将删除 swap 文件和配置${NC}"
    read -p "确定要继续吗? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "操作已取消"
        exit 0
    fi
    
    # 1. 禁用 swap
    if swapon --show | grep -q "$SWAP_FILE"; then
        echo -e "${BLUE}正在禁用 swap...${NC}"
        swapoff "$SWAP_FILE"
    fi
    
    # 2. 从 fstab 中删除
    if grep -q "$SWAP_FILE" /etc/fstab 2>/dev/null; then
        echo -e "${BLUE}正在从 /etc/fstab 中删除配置...${NC}"
        # 备份
        cp /etc/fstab /etc/fstab.backup.$(date +%Y%m%d_%H%M%S)
        # 删除包含 swap 文件的行（兼容 CentOS，使用临时备份）
        sed -i.tmp "\|$SWAP_FILE|d" /etc/fstab && rm -f /etc/fstab.tmp
        echo -e "${GREEN}✓ 已从 /etc/fstab 中删除${NC}"
    fi
    
    # 3. 删除 swap 文件
    if [ -f "$SWAP_FILE" ]; then
        echo -e "${BLUE}正在删除 swap 文件...${NC}"
        rm -f "$SWAP_FILE"
        echo -e "${GREEN}✓ Swap 文件已删除${NC}"
    fi
    
    echo -e "${GREEN}✓ 所有 swap 配置已删除${NC}"
}

# 主函数
main() {
    # 如果没有参数，显示帮助信息
    if [ -z "${1:-}" ]; then
        show_help
        exit 0
    fi
    
    case "$1" in
        create)
            create_swap "$2"
            ;;
        on|enable|start)
            enable_swap
            ;;
        off|disable|stop)
            disable_swap
            ;;
        status|info)
            show_status
            ;;
        setup|install)
            setup_all "$2"
            ;;
        remove|delete|uninstall)
            remove_swap
            ;;
        config|optimize)
            config_swap
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}错误: 未知命令: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"

