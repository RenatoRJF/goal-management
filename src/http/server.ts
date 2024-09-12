import z from 'zod'
import fastfy from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { createGoal } from '../services/create-goal'
import getWeekPendingGoals from '../services/get-week-peding-goals'

const app = fastfy().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.get('/pending-goals', async () => {
  const { pedingGoals } = await getWeekPendingGoals()

  return { pedingGoals }
})

app.post(
  '/goals',
  {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7),
      }),
    },
  },
  async ({ body }) => {
    const { title, desiredWeeklyFrequency } = body

    await createGoal({ title, desiredWeeklyFrequency })
  }
)

app.listen({ port: 3333 }).then(() => {
  console.log('Server running on port 3333')
})
