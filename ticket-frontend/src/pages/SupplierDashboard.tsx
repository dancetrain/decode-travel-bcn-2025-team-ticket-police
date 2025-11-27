import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
export function SupplierDashboard() {
  const navigate = useNavigate();
  const {
    tickets,
    individualTickets,
    currentUser
  } = useApp();
  const myTickets = tickets.filter(t => t.supplierId === currentUser?.id);
  const myIndividualTickets = individualTickets.filter(t => t.originalSupplierId === currentUser?.id);
  const stats = useMemo(() => {
    const totalIssued = myTickets.reduce((sum, t) => sum + t.quantity, 0);
    const totalSold = myTickets.reduce((sum, t) => sum + (t.quantity - t.remainingQuantity), 0);
    const totalAvailable = myTickets.reduce((sum, t) => sum + t.remainingQuantity, 0);
    const purchasedTickets = myIndividualTickets.filter(t => t.status === 'purchased');
    const resoldTickets = myIndividualTickets.filter(t => t.status === 'available_for_resale');
    const usedTickets = myIndividualTickets.filter(t => t.status === 'used');
    return {
      totalIssued,
      totalSold,
      totalAvailable,
      totalPurchased: purchasedTickets.length,
      totalResold: resoldTickets.length,
      totalUsed: usedTickets.length,
      totalBulkTickets: myTickets.length
    };
  }, [myTickets, myIndividualTickets]);
  const getTicketDetails = (bulkTicketId: string) => {
    const relatedIndividualTickets = myIndividualTickets.filter(t => t.bulkTicketId === bulkTicketId);
    const purchased = relatedIndividualTickets.filter(t => t.status === 'purchased').length;
    const resold = relatedIndividualTickets.filter(t => t.status === 'available_for_resale').length;
    const used = relatedIndividualTickets.filter(t => t.status === 'used').length;
    return {
      purchased,
      resold,
      used
    };
  };
  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Supplier Dashboard
          </h1>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => navigate('/point-of-sale')}>
              Point of Sale
            </Button>
            <Button onClick={() => navigate('/supplier/issue-ticket')}>
              Issue New Ticket
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Total Issued</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalIssued}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Available</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalAvailable}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Sold</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalSold}
            </div>
          </Card>
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Bulk Tickets</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalBulkTickets}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-12">
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Currently Owned</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalPurchased}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Tickets held by distributors
            </p>
          </Card>
          <Card>
            <div className="text-sm text-neutral-600 mb-1">
              Listed for Resale
            </div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalResold}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Tickets distributors are reselling
            </p>
          </Card>
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Used</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalUsed}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Tickets redeemed at entrance
            </p>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
            Your Ticket Batches
          </h2>

          {myTickets.length === 0 ? <div className="text-center py-12">
              <p className="text-neutral-600 mb-4">No tickets issued yet</p>
              <Button onClick={() => navigate('/supplier/issue-ticket')}>
                Issue Your First Ticket
              </Button>
            </div> : <div className="space-y-4">
              {myTickets.map(ticket => {
            const details = getTicketDetails(ticket.ticketId);
            return <div key={ticket.ticketId} className="border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {ticket.ticketName}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {ticket.venue} •{' '}
                          {new Date(ticket.eventDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${ticket.status === 'Available' ? 'bg-green-100 text-green-800' : ticket.status === 'Sold' ? 'bg-neutral-200 text-neutral-800' : ticket.status === 'Available for Resale' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="text-sm text-neutral-600 mb-3">
                          Inventory
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">
                              Total Issued:
                            </span>
                            <span className="font-medium text-neutral-900">
                              {ticket.quantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Remaining:</span>
                            <span className="font-medium text-neutral-900">
                              {ticket.remainingQuantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Sold:</span>
                            <span className="font-medium text-neutral-900">
                              {ticket.quantity - ticket.remainingQuantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-neutral-600 mb-3">
                          Ticket Status
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">
                              Currently Owned:
                            </span>
                            <span className="font-medium text-neutral-900">
                              {details.purchased}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">
                              Listed for Resale:
                            </span>
                            <span className="font-medium text-blue-600">
                              {details.resold}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Used:</span>
                            <span className="font-medium text-green-600">
                              {details.used}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-600">Price:</span>
                          <span className="ml-2 font-medium text-neutral-900">
                            ${ticket.price}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-600">Ticket ID:</span>
                          <span className="ml-2 font-medium text-neutral-900 font-mono text-xs">
                            {ticket.ticketId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {ticket.description && <p className="mt-4 text-sm text-neutral-600">
                        {ticket.description}
                      </p>}
                  </div>;
          })}
            </div>}
        </Card>
      </div>
    </div>;
}