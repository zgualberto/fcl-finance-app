import { ActivityLogRepository } from 'src/databases/repositories/activity-log.repository';

export class ActivityLogService {
  private activityLogRepository: ActivityLogRepository;
  constructor() {
    this.activityLogRepository = new ActivityLogRepository();
  }

  logActivity(log: unknown) {
    console.log('Activity logged');
    void this.activityLogRepository.insert({
      log: JSON.stringify(log),
    });
  }
  logErrActivity(message: string) {
    console.log('Error activity logged');
    void this.activityLogRepository.insert({
      log: message,
      is_error: true,
    });
  }
}
