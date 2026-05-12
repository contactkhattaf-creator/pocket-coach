import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onOpenChange, title, description, children }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border bg-card">
        {(title || description) && (
          <DrawerHeader className="text-left">
            {title && <DrawerTitle className="font-display text-lg text-foreground">{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}
        <div className="px-4 pb-8">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
