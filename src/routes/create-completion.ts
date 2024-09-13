import z from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import createGoalCompletion from '../services/create-goal-completion'

export const createCompletionRoute: FastifyPluginAsyncZod = async app => {
  app.post(
    '/goals-completions',
    {
      schema: {
        body: z.object({
          goalId: z.string(),
        }),
      },
    },
    async ({ body }) => {
      const { goalCompletion } = await createGoalCompletion({
        goalId: body.goalId,
      })

      return { goalCompletion }
    }
  )
}
