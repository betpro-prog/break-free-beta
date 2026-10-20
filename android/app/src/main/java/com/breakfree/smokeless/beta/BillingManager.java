package com.breakfree.smokeless.beta;

import android.app.Activity;
import android.app.AlertDialog;
import android.widget.Toast;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import java.util.Arrays;
import java.util.List;

/**
 * Google Play subscription integration groundwork.
 * No checkout or entitlement unlocks until Play Console catalog AND
 * a secure server-side verification/acknowledgement system exist.
 */
public final class BillingManager implements PurchasesUpdatedListener {
    public static final String VIP_ID = "breakfree_vip_monthly";
    private final Activity activity;
    private BillingClient client;
    private String displayedPrice = "3,99 € (proposed)";
    private boolean storeProductFound;

    public BillingManager(Activity activity) {
        this.activity = activity;
        if(BuildConfig.BILLING_ENABLED) connect();
    }

    private void connect() {
        client=BillingClient.newBuilder(activity).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts().build()).build();
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingServiceDisconnected() {
                storeProductFound=false;
            }
            @Override public void onBillingSetupFinished(BillingResult result) {
                if(result.getResponseCode()==BillingClient.BillingResponseCode.OK)
                    queryVipCatalog();
            }
        });
    }

    private void queryVipCatalog() {
        List<QueryProductDetailsParams.Product> products=Arrays.asList(
            QueryProductDetailsParams.Product.newBuilder()
            .setProductId(VIP_ID)
            .setProductType(BillingClient.ProductType.SUBS).build());
        QueryProductDetailsParams params=QueryProductDetailsParams.newBuilder()
            .setProductList(products).build();
        client.queryProductDetailsAsync(params,(result,details)->{
            if(result.getResponseCode()!=BillingClient.BillingResponseCode.OK)return;
            List<ProductDetails> found=details.getProductDetailsList();
            if(found.isEmpty())return;
            ProductDetails d=found.get(0);
            if(d.getSubscriptionOfferDetails()!=null &&
                !d.getSubscriptionOfferDetails().isEmpty()) {
                ProductDetails.PricingPhase phase=d.getSubscriptionOfferDetails().get(0)
                    .getPricingPhases().getPricingPhaseList().get(0);
                displayedPrice=phase.getFormattedPrice();
                storeProductFound=true;
            }
        });
    }

    public void showVipDialog() {
        String message="VIP features will include optional visual themes and advanced statistics.\n\n" +
            "Subscription target: " + displayedPrice + " / month.\n\n" +
            "Real purchases are not available yet. Google Play Console registration, " +
            "product activation, secure server verification and entitlement handling " +
            "must be finished before checkout can be enabled.\n\n" +
            "Core craving tools and the smoking log remain free.";
        new AlertDialog.Builder(activity)
            .setTitle("BREAK FREE VIP — preparation")
            .setMessage(message)
            .setPositiveButton("OK",(dialog,which)->dialog.dismiss())
            .show();
    }

    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        // Do NOT grant VIP access locally based on a callback.
        // This must be verified on a trusted server and acknowledged through Play.
        if(result.getResponseCode()==BillingClient.BillingResponseCode.OK &&
            purchases!=null&&!purchases.isEmpty()) {
            Toast.makeText(activity,
                "Purchase processing is not enabled in this beta. Contact support.",
                Toast.LENGTH_LONG).show();
        }
    }
    public void close() {
        if(client!=null){client.endConnection();client=null;}
    }
}
