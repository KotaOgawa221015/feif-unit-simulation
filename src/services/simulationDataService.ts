import { sql } from '../db.js'

export type SimulationData = {
  unit: {
    id: number
    name: string
    baseClass: string
  }
  classes: {
    id: number
    name: string
    type: string
    skills: {
      id: number
      lv: number
      name: string
    }[]
  }[]
}

export async function getSimulationData(unitName?: string): Promise<SimulationData | null> {
  const units = await sql`
    select
      u.id,
      u.name,
      fc.name as base_class
    from unit u
    join fe_class fc on fc.id = u.base_class_id
    where ${unitName ?? null}::text is null
       or u.name = ${unitName}
    order by u.id
    limit 1
  `

  const unit = units[0]

  if (!unit) {
    return null
  }

  const rows = await sql`
    select
      fc.id as class_id,
      fc.name as class_name,
      fc.type as class_type,
      s.id as skill_id,
      s.name as skill_name,
      cs.learn_level
    from fe_class fc
    left join class_skill cs on cs.fe_class_id = fc.id
    left join skill s on s.id = cs.skill_id
    order by fc.id, cs.learn_level
  `

  const classMap = new Map<number, SimulationData['classes'][number]>()

  for (const row of rows) {
    if (!classMap.has(row.class_id)) {
      classMap.set(row.class_id, {
        id: row.class_id,
        name: row.class_name,
        type: row.class_type,
        skills: [],
      })
    }

    if (row.skill_id) {
      classMap.get(row.class_id)!.skills.push({
        id: row.skill_id,
        lv: row.learn_level,
        name: row.skill_name,
      })
    }
  }

  return {
    unit: {
      id: unit.id,
      name: unit.name,
      baseClass: unit.base_class,
    },
    classes: [...classMap.values()],
  }
}