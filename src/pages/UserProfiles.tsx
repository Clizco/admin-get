import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import PageBreadcrumb from "../components/common/PageBreadCrumb"
import UserInfoCard from "../components/UserProfile/UserInfoCard"
import PageMeta from "../components/common/PageMeta"

export default function UserProfiles() {
  const navigate = useNavigate()

  return (
    <>
      <PageMeta
        title="Admin - Profile"
        description="User Profile"
      />

      {/* HEADER */}
      <div className="mb-4">
        {/* Mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Información Personal
          </h1>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
          <PageBreadcrumb pageTitle="Información Personal" />
        </div>
      </div>

      {/* CARD */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          <UserInfoCard />
        </div>
      </div>
    </>
  )
}
