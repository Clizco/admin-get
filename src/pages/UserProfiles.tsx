import PageBreadcrumb from "../components/common/PageBreadCrumb";

import UserInfoCard from "../components/UserProfile/UserInfoCard";
import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="Admin - Profile"
        description="User Profile"
      />
      <PageBreadcrumb pageTitle="Información Personal" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        
        <div className="space-y-6">
          
          <UserInfoCard />
        </div>
      </div>
    </>
  );
}
