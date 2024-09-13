import dayjs from 'dayjs'
import { lte, and, gte, count, eq, sql } from 'drizzle-orm'

import { db } from '../db'
import { goals, goalCompletions } from '../db/schema'

export async function getWeekSummary() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalsCreatedUpToWeek = db.$with('goal_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  )

  const goalsCompletionsInWeek = db.$with('goal_completion_counts').as(
    db
      .select({
        id: goalCompletions.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        completedAt: goalCompletions.createdAt,
        completedAtDate: sql /*sql*/`
          DATE(${goalCompletions.createdAt})
        `.as('completedAtDate'),
      })
      .from(goalCompletions)
      .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
  )

  const goalCompletionByWeekDay = db.$with('goal_completion_by_week_day').as(
    db
      .select({
        completedAtDate: goalsCompletionsInWeek.completedAtDate,
        completions: sql /*sql*/`
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', ${goalsCompletionsInWeek.id},
                'title', ${goalsCompletionsInWeek.title},
                'completedAt', ${goalsCompletionsInWeek.completedAt}
              )
            )
          `.as('completions'),
      })
      .from(goalsCompletionsInWeek)
      .groupBy(goalsCompletionsInWeek.completedAtDate)
  )

  const result = await db
    .with(goalsCreatedUpToWeek, goalsCompletionsInWeek, goalCompletionByWeekDay)
    .select({
      completed:
        sql /*sql*/`(SELECT COUNT(*) FROM ${goalsCompletionsInWeek})`.mapWith(
          Number
        ),
      total:
        sql /*sql*/`(SELECT SUM(${goalsCreatedUpToWeek.desiredWeeklyFrequency}) FROM ${goalsCompletionsInWeek})`.mapWith(
          Number
        ),
      goalsPerDay: sql /*sql*/`
          JSON_OBJECT_AGG(
            ${goalCompletionByWeekDay.completedAtDate},
            ${goalCompletionByWeekDay.completions}
          )
        `,
    })
    .from(goalCompletionByWeekDay)

  return {
    summary: 'Tests',
    result,
  }
}
