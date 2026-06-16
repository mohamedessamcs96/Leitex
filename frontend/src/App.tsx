import { useStore } from './store'
import Sidebar from './components/Sidebar'
import POSView from './components/POSView'
import TablesView from './components/TablesView'
import KDSView from './components/KDSView'
import InventoryView from './components/InventoryView'
import AnalyticsView from './components/AnalyticsView'
import BackOfficeView from './components/backoffice/BackOfficeView'
import CRMView from './components/crm/CRMView'
import DeliveryView from './components/delivery/DeliveryView'
import SubscriptionsView from './components/subscriptions/SubscriptionsView'
import Toast from './components/Toast'
import PinModal from './components/PinModal'
import LoginScreen from './components/LoginScreen'

export default function App() {
  const view         = useStore((s) => s.view)
  const currentStaff = useStore((s) => s.currentStaff)
  const showPinModal = useStore((s) => s.showPinModal)

  if (!currentStaff) {
    return (<><LoginScreen /><Toast /></>)
  }

  return (
    <div className="theme-light" style={{ display:'flex', height:'100vh', width:'100vw', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {view === 'pos'           && <POSView />}
        {view === 'tables'        && <TablesView />}
        {view === 'kds'           && <KDSView />}
        {view === 'inventory'     && <InventoryView />}
        {view === 'analytics'     && <AnalyticsView />}
        {view === 'backoffice'    && <BackOfficeView />}
        {view === 'crm'           && <CRMView />}
        {view === 'delivery'      && <DeliveryView />}
        {view === 'subscriptions' && <SubscriptionsView />}
      </main>
      <Toast />
      {showPinModal && <PinModal />}
    </div>
  )
}
