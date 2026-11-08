import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = Omit<ComponentProps<typeof Button>, 'size' | 'aria-label'> & {
  /** Names the button for screen readers and shows as its tooltip. */
  label: string
}

/** An icon-only button: put the icon (or a link around it, with asChild) as the child. */
export function IconButton({ label, children, ...props }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
