// import React from 'react';
import { analyticsData } from '../utils/mockData';
import { BarChartIcon, PieChartIcon, LineChartIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
const Analytics = () => {
  return <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track your job search metrics and industry trends
        </p>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Applications
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">28</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-md">
              <BarChartIcon className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">
              12% increase
            </span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">32%</p>
            </div>
            <div className="p-2 bg-green-50 rounded-md">
              <PieChartIcon className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">
              5% increase
            </span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Interview Rate
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">18%</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-md">
              <LineChartIcon className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-sm text-red-600 font-medium">
              3% decrease
            </span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Time to Interview
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">8 days</p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-md">
              <BarChartIcon className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">
              2 days faster
            </span>
            <span className="text-sm text-gray-500 ml-1">than last month</span>
          </div>
        </div>
      </div>
      {/* Application Status Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Applications by Status
        </h2>
        <div className="h-64 flex items-end justify-around">
          {analyticsData.applicationsByStatus.map(status => <div key={status.name} className="flex flex-col items-center">
              <div className={`w-16 rounded-t-md ${status.name === 'Applied' ? 'bg-blue-500' : status.name === 'Interview' ? 'bg-yellow-500' : status.name === 'Offer' ? 'bg-green-500' : status.name === 'Rejected' ? 'bg-red-500' : 'bg-purple-500'}`} style={{
            height: `${status.value / 12 * 200}px`
          }}></div>
              <div className="mt-2 text-sm text-gray-600">{status.name}</div>
              <div className="text-sm font-medium">{status.value}</div>
            </div>)}
        </div>
      </div>
      {/* Application Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Application Trends
        </h2>
        <div className="h-64 flex items-end space-x-12 justify-center">
          {analyticsData.applicationsByWeek.map(week => <div key={week.week} className="flex flex-col items-center">
              <div className="w-16 bg-blue-500 rounded-t-md" style={{
            height: `${week.count * 20}px`
          }}></div>
              <div className="mt-2 text-sm text-gray-600">{week.week}</div>
              <div className="text-sm font-medium">{week.count} apps</div>
            </div>)}
        </div>
      </div>
      {/* Industry Trends */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Job Market Trends
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Open Positions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.jobTrendsByIndustry.map(industry => <tr key={industry.industry}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {industry.industry}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {industry.openings}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${industry.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {industry.growth}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {industry.growth.startsWith('+') ? <TrendingUpIcon className="h-5 w-5 text-green-500" /> : <TrendingDownIcon className="h-5 w-5 text-red-500" />}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Skills in Demand */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Skills in Demand
        </h2>
        <div className="flex flex-wrap gap-3">
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full flex items-center">
            <span className="font-medium">React</span>
            <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              +24%
            </span>
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full flex items-center">
            <span className="font-medium">TypeScript</span>
            <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              +18%
            </span>
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full flex items-center">
            <span className="font-medium">AWS</span>
            <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              +15%
            </span>
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full flex items-center">
            <span className="font-medium">Node.js</span>
            <span className="ml-2 bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
              +12%
            </span>
          </div>
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full flex items-center">
            <span className="font-medium">Python</span>
            <span className="ml-2 bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
              +10%
            </span>
          </div>
          <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full flex items-center">
            <span className="font-medium">GraphQL</span>
            <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
              +8%
            </span>
          </div>
          <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full flex items-center">
            <span className="font-medium">Docker</span>
            <span className="ml-2 bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-xs">
              +6%
            </span>
          </div>
          <div className="px-4 py-2 bg-red-100 text-red-800 rounded-full flex items-center">
            <span className="font-medium">jQuery</span>
            <span className="ml-2 bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-xs">
              -5%
            </span>
          </div>
        </div>
      </div>
    </div>;
};
export default Analytics;
