import Link from "next/link";
import { forwardRef } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { getTools } from "@/app/queries";
import NavigationAuthButton from "@/components/navigation-auth-button";

export default async function Navigation() {
  const tools = await getTools();

  return (
    <div className="fixed z-50 flex h-14 w-full items-center px-3 shadow-md backdrop-blur-lg md:px-[10vw]">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  "bg-white/0 text-base hover:bg-none hover:text-blue-500",
                )}
              >
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-white/0 text-base  hover:text-blue-500">
              Tools
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid max-h-96 w-[400px] gap-3 overflow-y-scroll p-2 md:max-h-max md:w-[500px] md:grid-cols-2 md:overflow-y-clip lg:w-[600px]">
                {tools.map((tool) => (
                  <ListItem
                    key={tool.name}
                    href={`../tool/${tool.url}`}
                    title={tool.name}
                  >
                    {tool.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationAuthButton />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, children, title, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
