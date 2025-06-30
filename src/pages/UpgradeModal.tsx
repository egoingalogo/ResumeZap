@@ .. @@
 import { PayPalButton } from './PayPalButton';
+import { getLifetimePlanPrice } from '../lib/appSettings';
 
 interface UpgradeModalProps {
   isOpen: boolean;
@@ .. @@
   const { upgradePlan } = useAuthStore();
   const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
   const [isAnnual, setIsAnnual] = useState<boolean>(false);
+  const [lifetimePrice, setLifetimePrice] = useState<string>("79.99"); // Default fallback price
   const [showPayPal, setShowPayPal] = useState<Record<string, boolean>>({
     premium: false,
     pro: false,
@@ .. @@
   console.log('UpgradeModal: Rendered with current plan:', currentPlan);
   console.log('UpgradeModal: Lifetime user count:', lifetimeUserCount);
 
+  // Fetch the current lifetime plan price from the database
+  useEffect(() => {
+    if (showLifetimePlan) {
+      const fetchLifetimePrice = async () => {
+        try {
+          console.log('UpgradeModal: Fetching lifetime plan price');
+          const price = await getLifetimePlanPrice();
+          setLifetimePrice(price);
+          console.log('UpgradeModal: Lifetime plan price fetched:', price);
+        } catch (error) {
+          console.error('UpgradeModal: Failed to fetch lifetime plan price:', error);
+          // Keep using default price
+        }
+      };
+      
+      fetchLifetimePrice();
+    }
+  }, [showLifetimePlan]);
+
   // Prevent body scroll when modal is open
   useEffect(() => {
     if (isOpen) {
@@ .. @@
     if (showLifetimePlan) {
       plans.push({
         id: 'lifetime',
         name: 'Lifetime',
-        price: '$79.99',
+        price: `$${lifetimePrice}`,
         period: 'one-time',
         description: 'Limited early adopter offer',
         features: [
@@ .. @@
                       </div>
                     )}
                     
-                    {/* Action Button */}
+                    {/* Action Button - show PayPal button or regular button */}
                     {showPayPal[plan.id] ? (
                       <PayPalButton
                         planType={plan.id as 'premium' | 'pro' | 'lifetime'}