/** Right side of the generate page. Stays blank until a preview is requested. */
export function ReportPreview() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Report Preview</h2>
      <div className="min-h-96 flex-1 rounded-xl bg-card shadow-sm ring-1 ring-foreground/10" />
    </section>
  )
}
