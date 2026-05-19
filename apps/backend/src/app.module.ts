import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { BatchesModule } from './batches/batches.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FeesModule } from './fees/fees.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { MessagesModule } from './messages/messages.module';
import { ClassesModule } from './classes/classes.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ExamsModule } from './exams/exams.module';
import { ResourcesModule } from './resources/resources.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutes in ms
    }),
    SupabaseModule,
    AuthModule,
    StudentsModule,
    BatchesModule,
    AttendanceModule,
    FeesModule,
    AssignmentsModule,
    MessagesModule,
    ClassesModule,
    AnalyticsModule,
    NotificationsModule,
    ExamsModule,
    ResourcesModule,
    HealthModule,
  ],
})
export class AppModule {}
