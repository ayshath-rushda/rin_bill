import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/api/order.api';
import StatusBadge from '@/components/shared/StatusBadge';
import StatusTimeline from '@/components/shared/StatusTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

const VALID_NEXT = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['packing', 'cancelled'],
  packing: ['dispatched'],
  dispatched: ['delivered'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id),
  });

  const order = data;

  const statusMutation = useMutation({
    mutationFn: (status) => orderApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders-admin'] });
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to update status'),
  });

  const courierMutation = useMutation({
    mutationFn: (data) => orderApi.assignCourier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      toast.success('Courier assigned');
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to assign courier'),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/admin/orders">Back to Orders</Link></Button>
      </div>
    );
  }

  const nextStatuses = VALID_NEXT[order.orderStatus] || [];

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus) statusMutation.mutate(newStatus);
  };

  const handleCourierSubmit = (e) => {
    e.preventDefault();
    if (!courierName || !trackingNumber) {
      toast.error('Courier name and tracking number required');
      return;
    }
    courierMutation.mutate({ courierName, trackingNumber, dispatchDate: dispatchDate || undefined, estimatedDelivery: estimatedDelivery || undefined });
  };

  const timestamps = {};
  if (order.createdAt) timestamps[order.orderStatus] = order.createdAt;
  if (order.updatedAt) timestamps[order.orderStatus] = order.updatedAt;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/orders')}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <StatusBadge status={order.orderStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="size-5" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2">Product</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item) => (
                    <tr key={item._id} className="border-b last:border-0">
                      <td className="py-2 flex items-center gap-2">
                        {item.productSnapshot?.image && (
                          <img src={item.productSnapshot.image} alt="" className="size-8 rounded object-cover" />
                        )}
                        <span>{item.productSnapshot?.name || 'Product'}</span>
                      </td>
                      <td className="py-2">{item.quantity}</td>
                      <td className="py-2">₹{item.price?.toLocaleString()}</td>
                      <td className="py-2 text-right">₹{(item.price * item.quantity)?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={3} className="pt-3 text-right">Total:</td>
                    <td className="pt-3 text-right">₹{order.total?.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline currentStatus={order.orderStatus} timestamps={timestamps} />
            </CardContent>
          </Card>

          {nextStatuses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value=""
                  onChange={handleStatusChange}
                  className="border rounded-md px-3 py-2 text-sm bg-background w-full max-w-xs"
                >
                  <option value="">Select next status...</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <span className={`capitalize ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{order.total?.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{order.user?.name || 'N/A'}</p>
              <p className="text-muted-foreground">{order.user?.email}</p>
              {order.addressSnapshot && (
                <div className="mt-2 text-muted-foreground">
                  <p>{order.addressSnapshot.line1}</p>
                  {order.addressSnapshot.line2 && <p>{order.addressSnapshot.line2}</p>}
                  <p>{order.addressSnapshot.city}, {order.addressSnapshot.state} - {order.addressSnapshot.pincode}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="size-4" /> Courier
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.courier ? (
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Courier:</span> {order.courier.courierName}</p>
                  <p><span className="text-muted-foreground">Tracking:</span> {order.courier.trackingNumber}</p>
                  {order.courier.dispatchDate && (
                    <p><span className="text-muted-foreground">Dispatched:</span> {new Date(order.courier.dispatchDate).toLocaleDateString('en-IN')}</p>
                  )}
                  {order.courier.estimatedDelivery && (
                    <p><span className="text-muted-foreground">Est. Delivery:</span> {new Date(order.courier.estimatedDelivery).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCourierSubmit} className="space-y-2">
                  <Input placeholder="Courier name" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
                  <Input placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Dispatch Date</label>
                    <Input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Est. Delivery</label>
                    <Input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} className="h-9" />
                  </div>
                  <Button type="submit" size="sm" className="w-full">Assign Courier</Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
