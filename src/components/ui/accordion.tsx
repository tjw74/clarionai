import * as React from "react"
import * as RadixAccordion from "@radix-ui/react-accordion"
import { cn } from "@/lib/utils"

const Accordion = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Root>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Root>
>(({ className, ...props }, ref) => (
  <RadixAccordion.Root ref={ref} className={cn("border border-white/10 rounded-2xl bg-[#18181b] text-white", className)} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Item>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Item>
>(({ className, ...props }, ref) => (
  <RadixAccordion.Item ref={ref} className={cn("border-b border-white/10 last:border-b-0", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Trigger>
>(({ className, children, ...props }, ref) => (
  <RadixAccordion.Header asChild>
    <RadixAccordion.Trigger
      ref={ref}
      className={cn(
        "flex w-full items-center justify-between px-6 py-4 text-lg font-semibold text-white/90 hover:bg-white/5 rounded-t-2xl focus:outline-none transition-colors",
        className
      )}
      {...props}
    >
      {children}
      <svg
        className="ml-2 h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </RadixAccordion.Trigger>
  </RadixAccordion.Header>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof RadixAccordion.Content>,
  React.ComponentPropsWithoutRef<typeof RadixAccordion.Content>
>(({ className, ...props }, ref) => (
  <RadixAccordion.Content
    ref={ref}
    className={cn(
      "px-6 pb-6 pt-2 text-white/80 text-base leading-relaxed data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  />
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } 