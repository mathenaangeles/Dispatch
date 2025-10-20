import { useState } from 'react';
import { CheckCircle, XCircle, FileCode, ChevronRight, ChevronLeft, AlertTriangle, Filter } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function ApprovalSidebar({ findings, isOpen, onToggle }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [areStatusButtonsVisible, setAreStatusButtonsVisible] = useState(true);
  
  const approvedFindings = findings.filter(f => f.approved);
  const rejectedFindings = findings.filter(f => f.rejected);
  const pendingFindings = findings.filter(f => !f.approved && !f.rejected);

  const handleFilterClick = (filter) => {
    if (activeFilter === filter) {
      // If user clicks the active filter, reset to 'all'
      setActiveFilter('all');
    } else {
      // Set new filter
      setActiveFilter(filter);
      // Ensure buttons are visible when a filter is applied
      setAreStatusButtonsVisible(true);
    }
  };

  // List is visible if filter is 'all' OR if it matches the active filter
  const isApprovedVisible = activeFilter === 'all' || activeFilter === 'approved';
  const isRejectedVisible = activeFilter === 'all' || activeFilter === 'rejected';
  const isPendingVisible = activeFilter === 'all' || activeFilter === 'pending';

  return (
    <>
      <div
        className={`fixed right-0 top-20 h-[calc(100vh-5rem)] bg-white border-l border-gray-200 shadow-xl transition-all duration-300 z-40 ${isOpen ? 'w-[450px]' : 'w-0'} overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900">Review Status</h3>
              {activeFilter !== 'all' ? (
                // Show Reset button when a filter is active
                <button 
                    onClick={() => setActiveFilter('all')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium p-1 rounded-md hover:bg-gray-100"
                >
                    <Filter className="w-5 h-5" /> Reset Filter
                </button>
              ) : (
                // Show Collapse/Expand button when in 'all' view
                <button 
                    onClick={() => setAreStatusButtonsVisible(!areStatusButtonsVisible)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label={areStatusButtonsVisible ? "Collapse filter buttons" : "Expand filter buttons"}
                >
                    <Filter className={`w-5 h-5 ${areStatusButtonsVisible ? 'text-gray-600' : 'text-gray-400'}`} />
                </button>
              )}
            </div>
            {/* Filter Buttons */}
            {areStatusButtonsVisible && (
              <div className="flex gap-2 text-xs">
                <button 
                  className={`${activeFilter === 'approved' 
                      ? 'bg-green-600 text-white shadow-md' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'} px-2 py-1 rounded font-medium transition-colors whitespace-nowrap`}
                  onClick={() => handleFilterClick('approved')}
                >
                  {approvedFindings.length} Approved
                </button>
                
                <button 
                  className={`${activeFilter === 'rejected' 
                      ? 'bg-gray-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} px-2 py-1 rounded font-medium transition-colors whitespace-nowrap`}
                  onClick={() => handleFilterClick('rejected')}
                >
                  {rejectedFindings.length} Rejected
                </button>
                
                <button 
                  className={`${activeFilter === 'pending' 
                      ? 'bg-amber-600 text-white shadow-md' 
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'} px-2 py-1 rounded font-medium transition-colors whitespace-nowrap`}
                  onClick={() => handleFilterClick('pending')}
                >
                  {pendingFindings.length} Pending
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {isApprovedVisible && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Approved for Patching
                  </h4>
                </div>
                <div className="space-y-2">
                  {approvedFindings.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No approved findings yet</p>
                      <p className="text-xs text-gray-400 mt-1">Review and approve fixes below</p>
                    </div>
                  ) : (
                    approvedFindings.map(finding => (
                      <div key={finding.id} className="bg-white border-2 border-green-200 rounded-lg p-3 hover:border-green-300 transition-colors shadow-sm">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={finding.severity} />
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate">{finding.type}</p>
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                              <FileCode className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{finding.file}:{finding.line}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            
            {isRejectedVisible && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-gray-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Rejected
                  </h4>
                </div>
                <div className="space-y-2">
                  {rejectedFindings.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <XCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No rejected findings yet</p>
                      <p className="text-xs text-gray-400 mt-1">Review and reject fixes below</p>
                    </div>
                  ) : (
                    rejectedFindings.map(finding => (
                      <div key={finding.id} className="bg-white border border-gray-200 rounded-lg p-3 opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={finding.severity} />
                            </div>
                            <p className="text-xs font-semibold text-gray-700 truncate">{finding.type}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <FileCode className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{finding.file}:{finding.line}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            
            {isPendingVisible && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Needs Review
                  </h4>
                </div>
                <div className="space-y-2">
                  {pendingFindings.length === 0 ? (
                    <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-green-700 font-medium">All reviewed!</p>
                    </div>
                  ) : (
                    pendingFindings.map(finding => (
                      <div key={finding.id} className="bg-white border-2 border-amber-200 rounded-lg p-3 hover:border-amber-300 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <SeverityBadge severity={finding.severity} />
                            </div>
                            <p className="text-xs font-semibold text-gray-900 truncate">{finding.type}</p>
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                              <FileCode className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{finding.file}:{finding.line}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-l-lg shadow-lg z-50 transition-all"
        style={{ right: isOpen ? '450px' : '0' }}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </>
  );
}
