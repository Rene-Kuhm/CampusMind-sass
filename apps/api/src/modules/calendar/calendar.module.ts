import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { ScheduleService } from "./schedule.service";

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, ScheduleService],
  exports: [CalendarService, ScheduleService],
})
export class CalendarModule {}
