import { useApp } from "@/lib/store";
import { useState, useEffect } from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function Heatmap() {
  const { getDailyProgress } = useApp();
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const today = new Date();
  const daysToShow = isMobile ? 49 : 364;
  const startDate = subDays(today, daysToShow - 1);
  const dates = eachDayOfInterval({ start: startDate, end: today });

  const getColor = (percentage: number) => {
    if (percentage === 0) return "bg-muted";
    if (percentage < 30) return "bg-primary/30";
    if (percentage < 60) return "bg-primary/60";
    return "bg-primary";
  };

  return (
    <div className="w-full">
      <div className="flex gap-1 text-[10px] text-muted-foreground mb-1 ml-6 overflow-hidden">
        {isMobile ? (
          <div className="flex justify-between w-full pr-4">
            <span>Há 3 meses</span>
            <span>Hoje</span>
          </div>
        ) : (
          <>
            <span>Jan</span> <span className="ml-4">Fev</span> <span className="ml-4">Mar</span>
            <span className="ml-4">Abr</span> <span className="ml-4">Mai</span> <span className="ml-4">Jun</span>
            <span className="ml-4">Jul</span> <span className="ml-4">Ago</span> <span className="ml-4">Set</span>
            <span className="ml-4">Out</span> <span className="ml-4">Nov</span> <span className="ml-4">Dez</span>
          </>
        )}
      </div>
      
      <div className="flex gap-2 items-start">
         <div className="grid grid-rows-7 gap-1 text-[9px] text-muted-foreground shrink-0 leading-none h-[104px] md:h-[125px]">
           <div className="flex items-center justify-center">S</div>
           <div className=""></div>
           <div className="flex items-center justify-center">Q</div>
           <div className=""></div>
           <div className="flex items-center justify-center">S</div>
           <div className=""></div>
           <div className="flex items-center justify-center">D</div>
         </div>

         <div className="flex-1 min-w-0">
           <div className="grid grid-flow-col grid-rows-7 gap-1 w-full h-[104px] md:h-[125px]">
             {dates.map((date) => {
               const dateStr = format(date, "yyyy-MM-dd");
               const progress = getDailyProgress(dateStr);
               
               return (
                 <TooltipProvider key={dateStr}>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div 
                         className={cn(
                           "h-full w-full rounded-[1px] transition-colors hover:ring-1 hover:ring-ring hover:ring-offset-1",
                           getColor(progress)
                         )}
                       />
                     </TooltipTrigger>
                     <TooltipContent>
                       <p className="font-medium text-xs">{format(date, "dd MMM yyyy")}</p>
                       <p className="text-[10px] text-white">{progress}% completado</p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               );
             })}
           </div>
         </div>
      </div>
    </div>
  );
}
