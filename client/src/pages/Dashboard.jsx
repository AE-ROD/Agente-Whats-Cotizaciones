import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MessageCircle, Calendar, FileText, Settings, Home, Users } from 'lucide-react'
import TabMensajes from '@/components/TabMensajes'
import TabTurnos from '@/components/TabTurnos'
import TabCotizaciones from '@/components/TabCotizaciones'
import TabConfiguracion from '@/components/TabConfiguracion'
import TabContactos from '@/components/TabContactos'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#063740] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#a8781a] rounded-full flex items-center justify-center font-bold text-sm">K</div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Klin</h1>
            <p className="text-xs text-teal-200">Panel de administración</p>
          </div>
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-sm text-teal-200 hover:text-white transition-colors">
          <Home className="w-4 h-4" /> Inicio
        </Link>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="mensajes">
          <TabsList className="mb-6 bg-white border shadow-sm w-full justify-start h-auto p-1 gap-1">
            <TabsTrigger
              value="mensajes"
              className="flex items-center gap-2 data-[state=active]:bg-[#063740] data-[state=active]:text-white px-4 py-2"
            >
              <MessageCircle className="w-4 h-4" /> Mensajes
            </TabsTrigger>
            <TabsTrigger
              value="turnos"
              className="flex items-center gap-2 data-[state=active]:bg-[#063740] data-[state=active]:text-white px-4 py-2"
            >
              <Calendar className="w-4 h-4" /> Turnos
            </TabsTrigger>
            <TabsTrigger
              value="cotizaciones"
              className="flex items-center gap-2 data-[state=active]:bg-[#063740] data-[state=active]:text-white px-4 py-2"
            >
              <FileText className="w-4 h-4" /> Cotizaciones
            </TabsTrigger>
            <TabsTrigger
              value="contactos"
              className="flex items-center gap-2 data-[state=active]:bg-[#063740] data-[state=active]:text-white px-4 py-2"
            >
              <Users className="w-4 h-4" /> Contactos
            </TabsTrigger>
            <TabsTrigger
              value="configuracion"
              className="flex items-center gap-2 data-[state=active]:bg-[#063740] data-[state=active]:text-white px-4 py-2"
            >
              <Settings className="w-4 h-4" /> Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mensajes"><TabMensajes /></TabsContent>
          <TabsContent value="turnos"><TabTurnos /></TabsContent>
          <TabsContent value="cotizaciones"><TabCotizaciones /></TabsContent>
          <TabsContent value="contactos"><TabContactos /></TabsContent>
          <TabsContent value="configuracion"><TabConfiguracion /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
