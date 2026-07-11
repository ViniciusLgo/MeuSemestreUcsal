interface Attachment {
  id:           string
  storage_path: string
  mime_type:    string
  size_bytes:   number
}

interface Props {
  attachments: Attachment[]
  supabaseUrl: string
}

export function ForumAttachmentPreview({ attachments, supabaseUrl }: Props) {
  if (!attachments.length) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {attachments.map((a) => {
        const url = `${supabaseUrl}/storage/v1/object/public/forum-attachments/${a.storage_path}`
        const isImage = a.mime_type.startsWith('image/')
        const kb = Math.round(a.size_bytes / 1024)

        if (isImage) {
          return (
            <a
              key={a.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-edge hover:border-fg-muted transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Anexo"
                className="max-h-48 max-w-xs object-contain bg-canvas"
                loading="lazy"
              />
            </a>
          )
        }

        return (
          <a
            key={a.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-edge rounded-lg hover:border-fg-muted transition-colors text-sm text-fg-muted"
          >
            <span>📄</span>
            <span>PDF — {kb} KB</span>
          </a>
        )
      })}
    </div>
  )
}
