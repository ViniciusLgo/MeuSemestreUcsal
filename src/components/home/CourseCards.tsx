import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const courses = [
  {
    code: 'BES',
    name: 'Engenharia de Software',
    type: 'Bacharelado',
    semesters: 8,
    shift: 'Matutino',
    subjects: 42,
    description:
      'Formação completa em desenvolvimento, arquitetura, qualidade e gestão de software.',
    variant: 'info' as const,
    gradient: 'from-[#238636] to-[#196127]',
  },
  {
    code: 'ADS',
    name: 'Análise e Desenvolvimento de Sistemas',
    type: 'Tecnólogo',
    semesters: 5,
    shift: 'Noturno',
    subjects: 23,
    description:
      'Curso tecnólogo focado no desenvolvimento ágil de sistemas e aplicações corporativas.',
    variant: 'default' as const,
    gradient: 'from-[#6e40c9] to-[#4a2d8a]',
  },
]

export function CourseCards() {
  return (
    <section className="container-page py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-fg mb-3">Escolha seu curso</h2>
        <p className="text-fg-muted max-w-lg mx-auto">
          Selecione o curso para explorar a matriz curricular, comparar professores e ler avaliações.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {courses.map((course) => (
          <Link key={course.code} href={`/curso/${course.code}`} className="group">
            <Card hover className="h-full">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${course.gradient} flex items-center justify-center mb-5`}
              >
                <span className="text-white font-bold text-sm">{course.code}</span>
              </div>

              <Badge variant={course.variant} className="mb-3">
                {course.type}
              </Badge>

              <h3 className="text-xl font-bold text-fg mb-2 group-hover:text-brand-400 transition-colors">
                {course.name}
              </h3>
              <p className="text-sm text-fg-muted mb-5 leading-relaxed">{course.description}</p>

              <div className="flex items-center gap-4 text-xs text-fg-subtle font-medium pt-4 border-t border-edge-muted">
                <span>{course.semesters} semestres</span>
                <span>{course.shift}</span>
                <span>{course.subjects} disciplinas</span>
                <span>Pituaçu</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
