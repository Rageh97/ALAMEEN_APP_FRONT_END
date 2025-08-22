import { useState } from 'react'
import EmployeeManagement from './EmployeeManagement'
import RolesManagement from './RolesManagement'
import UsersManagement from './UsersManagement'
import OrderManagement from './OrderManagement'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders')

  const tabs = [
    { id: 'orders', label: 'Orders', component: OrderManagement },
    { id: 'employees', label: 'Employees', component: EmployeeManagement },
    { id: 'roles', label: 'Roles', component: RolesManagement },
    { id: 'users', label: 'Users', component: UsersManagement }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
