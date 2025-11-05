import {
  FileOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  FileExcelOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileMarkdownOutlined,
  CodeOutlined,
  VideoCameraOutlined,
  AudioOutlined,
} from '@ant-design/icons'

interface FileIconProps {
  extension: string
  className?: string
}

export function FileIcon({ extension, className }: FileIconProps) {
  const ext = extension.toLowerCase()

  // Image files
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return <FileImageOutlined className={className} />
  }

  // Document files
  if (['doc', 'docx'].includes(ext)) {
    return <FileWordOutlined className={className} />
  }

  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileExcelOutlined className={className} />
  }

  if (['ppt', 'pptx'].includes(ext)) {
    return <FilePptOutlined className={className} />
  }

  if (ext === 'pdf') {
    return <FilePdfOutlined className={className} />
  }

  if (['txt', 'log'].includes(ext)) {
    return <FileTextOutlined className={className} />
  }

  if (['md', 'markdown'].includes(ext)) {
    return <FileMarkdownOutlined className={className} />
  }

  // Code files
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext)) {
    return <CodeOutlined className={className} />
  }

  // Archive files
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileZipOutlined className={className} />
  }

  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
    return <VideoCameraOutlined className={className} />
  }

  // Audio files
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
    return <AudioOutlined className={className} />
  }

  // Default
  return <FileOutlined className={className} />
}

