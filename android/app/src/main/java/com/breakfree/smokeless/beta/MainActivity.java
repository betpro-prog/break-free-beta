package com.breakfree.smokeless.beta;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Color;
import android.widget.Toast;
import android.webkit.ValueCallback;

import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewAssetLoader.AssetsPathHandler;

import java.io.OutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public final class MainActivity extends Activity {
    private static final int REQUEST_BACKUP_EXPORT = 420;
    private static final int REQUEST_BACKUP_IMPORT = 421;
    private static final String ASSET_BASE = "https://appassets.androidplatform.net/assets/";
    private WebView web;
    private ValueCallback<Uri[]> pendingChooser;
    private String backupJson;
    private String csvExport;
    private BillingManager billing;
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(16, 27, 34));
        getWindow().setNavigationBarColor(Color.rgb(16, 27, 34));
        billing = new BillingManager(this);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new AssetsPathHandler(this))
            .build();
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(16,27,34));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        web.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                WebView view, android.webkit.WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("appassets.androidplatform.net".equals(url.getHost()) &&
                    "https".equalsIgnoreCase(url.getScheme()) &&
                    url.getPath() != null && url.getPath().startsWith("/assets/")) return false;
                openExternal(url);
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if(url.startsWith(ASSET_BASE)) {
                    view.evaluateJavascript(
                        "(function(){if(document.getElementById('bf-android-vip'))return;" +
                        "var foot=document.querySelector('.footer');if(!foot)return;" +
                        "var btn=document.createElement('button');btn.id='bf-android-vip';" +
                        "btn.type='button';btn.textContent='VIP · test';" +
                        "btn.style.cssText='display:inline-block;margin:8px;padding:8px 12px;" +
                        "border-radius:12px;background:#223942;color:#c7f976;border:1px solid #c7f976';" +
                        "btn.onclick=function(){window.BreakFreeAndroid.openVip()};foot.appendChild(btn)})()",null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> filePathCallback, FileChooserParams params) {
                if(pendingChooser != null)pendingChooser.onReceiveValue(null);
                pendingChooser = filePathCallback;
                try {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/json");
                    startActivityForResult(i, REQUEST_BACKUP_IMPORT);
                } catch(Exception e) { pendingChooser.onReceiveValue(null); pendingChooser=null; }
                return true;
            }
        });
        // Only a fixed, bundled first-party page receives this bridge. External links never load here.
        web.addJavascriptInterface(new AppBridge(), "BreakFreeAndroid");
        setContentView(web);
        web.loadUrl(ASSET_BASE + "index.html");
    }

    private void openExternal(Uri uri) {
        if(uri==null) return;
        String scheme=uri.getScheme();
        if(!"https".equalsIgnoreCase(scheme) && !"mailto".equalsIgnoreCase(scheme))return;
        try{ startActivity(new Intent(Intent.ACTION_VIEW,uri)); }
        catch(ActivityNotFoundException ex){ Toast.makeText(this,"No app can open this link",Toast.LENGTH_SHORT).show(); }
    }

    public final class AppBridge {
        @JavascriptInterface public void saveBackup(String json) {
            if(json == null || json.length()>1500000 || !json.startsWith("{")) return;
            main.post(()->{
                backupJson=json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "break-free-backup.json");
                try{ startActivityForResult(intent,REQUEST_BACKUP_EXPORT); }
                catch(ActivityNotFoundException ex){Toast.makeText(MainActivity.this,"Cannot save file",Toast.LENGTH_SHORT).show();}
            });
        }
        @JavascriptInterface public void saveCsv(String csv) {
            if(csv == null || csv.length()>200000 || !(csv.isEmpty() || csv.codePointAt(0)!=0xFEFF || !csv.substring(1).startsWith("date,cigarettes")))return;
            main.post(()->{
                csvExport=csv;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/csv");
                intent.putExtra(Intent.EXTRA_TITLE,"break-free-90-days.csv");
                try{startActivityForResult(intent,422);}
                catch(ActivityNotFoundException ex){Toast.makeText(MainActivity.this,"Cannot save CSV",Toast.LENGTH_SHORT).show();}
            });
        }
        @JavascriptInterface public void openVip(){ main.post(()-> billing.showVipDialog()); }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data){
        super.onActivityResult(requestCode,resultCode,data);
        if(requestCode==422){
            if(resultCode==RESULT_OK && data!=null && data.getData()!=null && csvExport!=null){
                try(OutputStream output=getContentResolver().openOutputStream(data.getData())){
                    if(output!=null){output.write(csvExport.getBytes(StandardCharsets.UTF_8));}
                    Toast.makeText(this,"CSV saved",Toast.LENGTH_SHORT).show();
                }catch(IOException ex){Toast.makeText(this,"Could not save CSV",Toast.LENGTH_LONG).show();}
            }
            csvExport=null;
        } else if(requestCode==REQUEST_BACKUP_IMPORT){
            if(pendingChooser!=null) {
                Uri[] uris = resultCode==RESULT_OK && data!=null && data.getData()!=null ?
                  new Uri[]{data.getData()} : null;
                pendingChooser.onReceiveValue(uris);
                pendingChooser=null;
            }
        } else if(requestCode==REQUEST_BACKUP_EXPORT && resultCode==RESULT_OK && data!=null && data.getData()!=null) {
            try(OutputStream output=getContentResolver().openOutputStream(data.getData())){
                if(output!=null && backupJson!=null){output.write(backupJson.getBytes(StandardCharsets.UTF_8));}
                Toast.makeText(this,"Backup saved",Toast.LENGTH_SHORT).show();
            } catch(IOException ex){Toast.makeText(this,"Could not save backup",Toast.LENGTH_LONG).show();}
            backupJson=null;
        }
    }

    @Override public void onBackPressed(){
        if(web!=null&&web.canGoBack()){web.goBack();}else{super.onBackPressed();}
    }
    @Override protected void onDestroy(){
        if(web!=null){web.removeJavascriptInterface("BreakFreeAndroid");web.destroy();}
        if(billing!=null)billing.close();
        super.onDestroy();
    }
}
