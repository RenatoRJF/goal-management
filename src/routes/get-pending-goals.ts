import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import getWeekPendingGoals from '../services/get-week-peding-goals'

export const getPendingGoalsRoute: FastifyPluginAsyncZod = async app => {
  app.get('/pending-goals', async () => {
    const { pedingGoals } = await getWeekPendingGoals()

    return { pedingGoals }
  })
}
