import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { SwipeDetector } from '../lib/swipe'
import { HapticFeedback } from '../lib/haptic'
import LoadingSpinner from './LoadingSpinner'
import PageLayout from './PageLayout'

function ResultsView({ roomId, roomName, onClose }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const modalRef = useRef(null)

  useEffect(() => {
    loadAssignments()
  }, [roomId])

  useEffect(() => {
    // Detectar swipe down para cerrar modal en móvil
    if (modalRef.current) {
      const swipeDetector = new SwipeDetector(modalRef.current, {
        onSwipeDown: () => {
          HapticFeedback.light()
          onClose()
        }
      })

      return () => swipeDetector.destroy()
    }
  }, [])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando asignaciones para room:', roomId)
      
      // Obtener todas las asignaciones con información de los participantes
      // Añadimos un timestamp para evitar caché
      const { data, error } = await supabase
        .from('secret_santa_assignments')
        .select(`
          *,
          giver:room_participants!giver_id(id, name, email),
          receiver:room_participants!receiver_id(id, name, email)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      console.log('✅ Asignaciones cargadas:', data?.map(a => ({ 
        id: a.id, 
        email_sent: a.email_sent 
      })))
      
      setAssignments(data || [])
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadResults = () => {
    HapticFeedback.medium()
    // Crear contenido CSV
    let csv = 'Quien regala,Email,Amigo invisible,Email amigo invisible\n'
    assignments.forEach(assignment => {
      csv += `${assignment.giver.name},${assignment.giver.email},${assignment.receiver.name},${assignment.receiver.email}\n`
    })

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sorteo-${roomName.replace(/\s+/g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    HapticFeedback.success()
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          ref={modalRef}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
            >
              ←
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Resultados del Sorteo</h2>
          </div>

          {/* Body */}
          <div className="p-6">
          {/* Info */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{roomName}</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">Total de asignaciones: {assignments.length}</p>
            <p className="text-red-600 dark:text-red-400 font-medium text-sm">
              ⚠️ Esta información es confidencial. Los invitados NO pueden verla.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="large" color="purple" />
              <p className="text-gray-600 dark:text-gray-400 mt-4">Cargando resultados...</p>
            </div>
          ) : (
            <>
              {/* Desktop: Table */}
              <div className="hidden md:block overflow-x-auto mb-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Quien regala</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">→</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">A quien regala</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Estado email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {assignments.map((assignment, index) => (
                      <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{assignment.giver.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.giver.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-purple-500 dark:text-purple-400 font-bold">→</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{assignment.receiver.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{assignment.receiver.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {assignment.email_sent ? (
                            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                              ✓ Enviado
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full">
                              ⏳ Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Cards */}
              <div className="md:hidden space-y-3 mb-6">
                {assignments.map((assignment, index) => (
                  <div 
                    key={assignment.id} 
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    {/* Número */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">#{index + 1}</span>
                      {assignment.email_sent ? (
                        <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                          ✓ Enviado
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full">
                          ⏳ Pendiente
                        </span>
                      )}
                    </div>

                    {/* Quien regala */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quien regala:</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{assignment.giver.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.giver.email}</p>
                    </div>

                    {/* Flecha */}
                    <div className="text-center text-purple-500 dark:text-purple-400 text-xl font-bold my-2">
                      ↓
                    </div>

                    {/* A quien regala */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">A quien regala:</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{assignment.receiver.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.receiver.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <button 
                  onClick={downloadResults}
                  className="w-full sm:w-auto px-6 py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  💾 Descargar CSV
                </button>
                <button 
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default ResultsView
