// ADICIONAR: Novo componente de gráfico
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface ChartProps {
  data: { name: string; value: number }[]
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

export function AnalyticsChart({ data }: ChartProps) {
  return (
    <div className=" `h-[200px]` w-full flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#10b981' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}