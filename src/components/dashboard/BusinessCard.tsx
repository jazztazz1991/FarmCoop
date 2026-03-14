import Link from "next/link";

interface BusinessCardProps {
  business: {
    id: string;
    type: string;
    name: string;
    ownerName: string;
    serverName: string;
    status: string;
    description: string;
  };
  isOwner?: boolean;
}

const typeIcons: Record<string, string> = {
  bank: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  dealership: "M8 7h12l2 5-2 5H8l-2-5 2-5zm0 0L6 3m6 4v10m-3-5h6",
  insurance: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  trucking: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
};

const typeLabels: Record<string, string> = {
  bank: "Bank",
  dealership: "Dealership",
  insurance: "Insurance",
  trucking: "Trucking",
};

const statusStyles: Record<string, string> = {
  active: "bg-green-900/50 text-green-300 border-green-700",
  suspended: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  closed: "bg-gray-800 text-gray-400 border-gray-700",
};

export default function BusinessCard({ business, isOwner }: BusinessCardProps) {
  const href = isOwner
    ? `/dashboard/businesses/${business.id}`
    : `/dashboard/businesses/${business.id}`;

  return (
    <Link href={href} className="block">
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-indigo-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={typeIcons[business.type] ?? typeIcons.bank}
              />
            </svg>
            <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">
              {typeLabels[business.type] ?? business.type}
            </span>
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded border ${statusStyles[business.status] ?? statusStyles.active}`}
          >
            {business.status}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-1">
          {business.name}
        </h3>

        {business.description && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {business.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Owner: {business.ownerName}</span>
          <span>{business.serverName}</span>
        </div>
      </div>
    </Link>
  );
}
