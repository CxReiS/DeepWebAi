/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Tooltip bileşeni - Native CSS hover tooltip implementation
import React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 700,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const sideClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-popover",
    bottom:
      "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-popover",
    left: "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-popover",
    right:
      "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-popover",
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-sm text-popover-foreground bg-popover border border-border rounded-md shadow-md whitespace-nowrap pointer-events-none",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            sideClasses[side],
            className
          )}
        >
          {content}
          <div
            className={cn("absolute w-0 h-0 border-4", arrowClasses[side])}
          />
        </div>
      )}
    </div>
  );
}

// Backward compatibility exports
export const TooltipProvider = React.Fragment;
export const TooltipTrigger = React.Fragment;
export const TooltipContent = React.Fragment;
