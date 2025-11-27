import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Pagination } from '../components/Pagination';
const ITEMS_PER_PAGE = 5;
export function DistributorDashboard() {
  const navigate = useNavigate();
  const {
    tickets,
    individualTickets,
    currentUser,
    purchaseTickets,
    resellTicket,
    purchaseResaleTicket
  } = useApp();
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    ticket: any;
    quantity: number;
  }>({
    isOpen: false,
    ticket: null,
    quantity: 1
  });
  const [resaleModal, setResaleModal] = useState<{
    isOpen: boolean;
    ticket: any;
    price: string;
  }>({
    isOpen: false,
    ticket: null,
    price: ''
  });
  const [purchasedTicketsPage, setPurchasedTicketsPage] = useState(1);
  const [resaleListingsPage, setResaleListingsPage] = useState(1);
  const filteredTickets = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) {
      return tickets;
    }
    return tickets.filter(ticket => {
      const eventDate = new Date(ticket.eventDate);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return eventDate >= start && eventDate <= end;
    });
  }, [tickets, dateRange]);
  const myPurchasedTickets = useMemo(() => {
    return individualTickets.filter(t => t.currentOwnerId === currentUser?.id && t.status === 'purchased');
  }, [individualTickets, currentUser]);
  const myResaleTickets = useMemo(() => {
    return individualTickets.filter(t => t.currentOwnerId === currentUser?.id && t.status === 'available_for_resale');
  }, [individualTickets, currentUser]);
  const availableResaleTickets = useMemo(() => {
    return individualTickets.filter(t => t.currentOwnerId !== currentUser?.id && t.status === 'available_for_resale');
  }, [individualTickets, currentUser]);
  // Pagination for purchased tickets
  const paginatedPurchasedTickets = useMemo(() => {
    const startIndex = (purchasedTicketsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return myPurchasedTickets.slice(startIndex, endIndex);
  }, [myPurchasedTickets, purchasedTicketsPage]);
  const purchasedTicketsTotalPages = Math.ceil(myPurchasedTickets.length / ITEMS_PER_PAGE);
  // Pagination for resale listings
  const paginatedResaleListings = useMemo(() => {
    const startIndex = (resaleListingsPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return myResaleTickets.slice(startIndex, endIndex);
  }, [myResaleTickets, resaleListingsPage]);
  const resaleListingsTotalPages = Math.ceil(myResaleTickets.length / ITEMS_PER_PAGE);
  const stats = useMemo(() => {
    const available = filteredTickets.filter(t => t.status === 'Available');
    const sold = filteredTickets.filter(t => t.status === 'Sold');
    const resale = availableResaleTickets;
    return {
      totalAvailable: available.reduce((sum, t) => sum + t.remainingQuantity, 0),
      totalSold: sold.length,
      totalResale: resale.length,
      totalTickets: filteredTickets.length
    };
  }, [filteredTickets, availableResaleTickets]);
  const handlePurchase = () => {
    try {
      purchaseTickets(purchaseModal.ticket.ticketId, purchaseModal.quantity, currentUser!.id);
      setPurchaseModal({
        isOpen: false,
        ticket: null,
        quantity: 1
      });
    } catch (error: any) {
      alert(error.message);
    }
  };
  const handleResell = () => {
    const price = parseFloat(resaleModal.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }
    resellTicket(resaleModal.ticket.individualTicketId, price);
    setResaleModal({
      isOpen: false,
      ticket: null,
      price: ''
    });
  };
  const handlePurchaseResale = (ticket: any) => {
    if (window.confirm(`Purchase this ticket for $${ticket.resalePrice}?`)) {
      purchaseResaleTicket(ticket.individualTicketId, currentUser!.id);
    }
  };
  return <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Distributor Dashboard
          </h1>
          <Button variant="secondary" onClick={() => navigate('/point-of-sale')}>
            Point of Sale
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Search Tickets
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={dateRange.startDate} onChange={e => setDateRange({
            ...dateRange,
            startDate: e.target.value
          })} />
            <Input label="End Date" type="date" value={dateRange.endDate} onChange={e => setDateRange({
            ...dateRange,
            endDate: e.target.value
          })} />
          </div>
          {(dateRange.startDate || dateRange.endDate) && <Button variant="secondary" className="mt-4" onClick={() => setDateRange({
          startDate: '',
          endDate: ''
        })}>
              Clear Filters
            </Button>}
        </Card>

        <div className="grid grid-cols-4 gap-6 mb-12">
          <Card>
            <div className="text-sm text-neutral-600 mb-1">Total Tickets</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalTickets}
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
            <div className="text-sm text-neutral-600 mb-1">For Resale</div>
            <div className="text-3xl font-semibold text-neutral-900">
              {stats.totalResale}
            </div>
          </Card>
        </div>

        {/* Purchased Tickets Section with Pagination */}
        {myPurchasedTickets.length > 0 && <Card className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              My Purchased Tickets ({myPurchasedTickets.length})
            </h2>
            <div className="space-y-4">
              {paginatedPurchasedTickets.map(ticket => <div key={ticket.individualTicketId} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        {ticket.ticketName}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {ticket.venue} •{' '}
                        {new Date(ticket.eventDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Original Supplier: {ticket.originalSupplierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-neutral-900 mb-1">
                        ${ticket.price}
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Purchased
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm mb-4">
                    <div>
                      <span className="text-neutral-600">Ticket ID:</span>
                      <span className="ml-2 font-medium text-neutral-900 font-mono text-xs">
                        {ticket.individualTicketId}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-600">Purchased:</span>
                      <span className="ml-2 font-medium text-neutral-900">
                        {new Date(ticket.purchaseDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Button variant="secondary" onClick={() => setResaleModal({
              isOpen: true,
              ticket,
              price: ticket.price.toString()
            })}>
                    List for Resale
                  </Button>
                </div>)}
            </div>

            <Pagination currentPage={purchasedTicketsPage} totalPages={purchasedTicketsTotalPages} onPageChange={setPurchasedTicketsPage} />
          </Card>}

        {/* My Resale Listings with Pagination */}
        {myResaleTickets.length > 0 && <Card className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              My Resale Listings ({myResaleTickets.length})
            </h2>
            <div className="space-y-4">
              {paginatedResaleListings.map(ticket => <div key={ticket.individualTicketId} className="border border-neutral-200 rounded-lg p-6">
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
                    <div className="text-right">
                      <div className="text-sm text-neutral-500 line-through">
                        ${ticket.price}
                      </div>
                      <div className="text-2xl font-semibold text-neutral-900 mb-1">
                        ${ticket.resalePrice}
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Listed for Resale
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-neutral-600">
                    Ticket ID:{' '}
                    <span className="font-mono text-xs">
                      {ticket.individualTicketId}
                    </span>
                  </div>
                </div>)}
            </div>

            <Pagination currentPage={resaleListingsPage} totalPages={resaleListingsTotalPages} onPageChange={setResaleListingsPage} />
          </Card>}

        {/* Available Tickets */}
        <Card className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
            Available Tickets
          </h2>

          {filteredTickets.filter(t => t.remainingQuantity > 0).length === 0 ? <div className="text-center py-12">
              <p className="text-neutral-600">No tickets available</p>
            </div> : <div className="space-y-4">
              {filteredTickets.filter(t => t.remainingQuantity > 0).map(ticket => <div key={ticket.ticketId} className="border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                          {ticket.ticketName}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {ticket.venue} •{' '}
                          {new Date(ticket.eventDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-neutral-500 mt-1">
                          Supplier: {ticket.supplierName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-neutral-900 mb-1">
                          ${ticket.price}
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {ticket.remainingQuantity} Available
                        </span>
                      </div>
                    </div>

                    {ticket.description && <p className="text-sm text-neutral-600 mb-4">
                        {ticket.description}
                      </p>}

                    <Button onClick={() => setPurchaseModal({
              isOpen: true,
              ticket,
              quantity: 1
            })}>
                      Purchase Tickets
                    </Button>
                  </div>)}
            </div>}
        </Card>

        {/* Resale Marketplace */}
        {availableResaleTickets.length > 0 && <Card>
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              Resale Marketplace ({availableResaleTickets.length})
            </h2>
            <div className="space-y-4">
              {availableResaleTickets.map(ticket => <div key={ticket.individualTicketId} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        {ticket.ticketName}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {ticket.venue} •{' '}
                        {new Date(ticket.eventDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Original Supplier: {ticket.originalSupplierName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-500 line-through">
                        ${ticket.price}
                      </div>
                      <div className="text-2xl font-semibold text-neutral-900 mb-1">
                        ${ticket.resalePrice}
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Resale
                      </span>
                    </div>
                  </div>

                  <Button onClick={() => handlePurchaseResale(ticket)}>
                    Buy Resale Ticket
                  </Button>
                </div>)}
            </div>
          </Card>}
      </div>

      {/* Purchase Modal */}
      {purchaseModal.isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <Card className="max-w-md w-full">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              Purchase Tickets
            </h2>
            <div className="mb-6">
              <p className="text-neutral-600 mb-2">
                {purchaseModal.ticket?.ticketName}
              </p>
              <p className="text-sm text-neutral-500">
                Available: {purchaseModal.ticket?.remainingQuantity} tickets
              </p>
              <p className="text-sm text-neutral-500">
                Price: ${purchaseModal.ticket?.price} per ticket
              </p>
            </div>

            <Input label="Quantity" type="number" min="1" max={purchaseModal.ticket?.remainingQuantity} value={purchaseModal.quantity} onChange={e => setPurchaseModal({
          ...purchaseModal,
          quantity: parseInt(e.target.value) || 1
        })} />

            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>
                  $
                  {(purchaseModal.ticket?.price * purchaseModal.quantity).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={handlePurchase} className="flex-1">
                Confirm Purchase
              </Button>
              <Button variant="secondary" onClick={() => setPurchaseModal({
            isOpen: false,
            ticket: null,
            quantity: 1
          })}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>}

      {/* Resale Modal */}
      {resaleModal.isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <Card className="max-w-md w-full">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
              List Ticket for Resale
            </h2>
            <div className="mb-6">
              <p className="text-neutral-600 mb-2">
                {resaleModal.ticket?.ticketName}
              </p>
              <p className="text-sm text-neutral-500">
                Original Price: ${resaleModal.ticket?.price}
              </p>
            </div>

            <Input label="Resale Price ($)" type="number" step="0.01" value={resaleModal.price} onChange={e => setResaleModal({
          ...resaleModal,
          price: e.target.value
        })} placeholder="Enter resale price" />

            <div className="flex gap-4 mt-6">
              <Button onClick={handleResell} className="flex-1">
                List for Resale
              </Button>
              <Button variant="secondary" onClick={() => setResaleModal({
            isOpen: false,
            ticket: null,
            price: ''
          })}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>}
    </div>;
}