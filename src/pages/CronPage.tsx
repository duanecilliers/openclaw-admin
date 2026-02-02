import { Clock } from 'lucide-react'
import CronJobList from '@/components/cron/CronJobList'

export default function CronPage() {
  return (
    <div className="py-8">
      <div className="mb-6 flex items-center gap-2">
        <Clock className="size-5 text-blue-400" />
        <div>
          <h2 className="text-lg font-semibold text-white">Cron Jobs</h2>
          <p className="text-sm text-muted-foreground">
            View and manage scheduled jobs
          </p>
        </div>
      </div>
      <CronJobList />
    </div>
  )
}
