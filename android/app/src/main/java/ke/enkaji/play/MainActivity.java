package ke.enkaji.play;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import java.util.Locale;

/**
 * Enkaji Play as an Android app. The whole website ships inside the APK (assets/www),
 * served from a private https origin so storage, IndexedDB and the microphone work.
 * Nothing is loaded from the internet. Android TextToSpeech stands in for the Web Speech API,
 * which Android WebView does not have.
 */
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final int MIC_REQUEST = 7;
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private PermissionRequest pendingMic;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#B71C1C"));

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return loader.shouldInterceptRequest(req.getUrl());
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                // Outside links (e.g. Care for Education) open in the phone's browser.
                try { startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Mama's Voice recorder asks for the microphone.
                if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    pendingMic = request;
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, MIC_REQUEST);
                } else {
                    request.grant(request.getResources());
                }
            }
        });
        web.addJavascriptInterface(new Bridge(), "EnkajiApp");

        tts = new TextToSpeech(this, status -> ttsReady = status == TextToSpeech.SUCCESS);
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onDone(String id) { done(id); }
            @Override public void onError(String id) { done(id); }
        });

        if (state != null) web.restoreState(state); else web.loadUrl(START);
    }

    private void done(final String id) {
        runOnUiThread(() -> web.evaluateJavascript("window.__ttsDone && window.__ttsDone(" + org.json.JSONObject.quote(id) + ")", null));
    }

    /** Called from JavaScript as window.EnkajiApp. */
    public class Bridge {
        @JavascriptInterface
        public boolean speak(String text, String lang, String id) {
            if (!ttsReady) return false;
            android.speech.tts.Voice v = bestVoice(lang);
            if (v != null) tts.setVoice(v); else tts.setLanguage(new Locale("en", "KE"));
            tts.setSpeechRate(0.9f);
            return tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id) == TextToSpeech.SUCCESS;
        }
        @JavascriptInterface public void stop() { if (tts != null) tts.stop(); }
        @JavascriptInterface public boolean speaking() { return tts != null && tts.isSpeaking(); }
        @JavascriptInterface public String voice(String lang) {
            android.speech.tts.Voice v = ttsReady ? bestVoice(lang) : null;
            if (v == null) return "none";
            Locale l = v.getLocale();
            return l.getDisplayLanguage(Locale.ENGLISH) + (l.getCountry().isEmpty() ? "" : " (" + l.getDisplayCountry(Locale.ENGLISH) + ")");
        }
        /** True when the phone has a Kenyan English or Swahili voice. */
        @JavascriptInterface public boolean kenyan() {
            android.speech.tts.Voice v = ttsReady ? bestVoice("en") : null;
            return v != null && ("KE".equals(v.getLocale().getCountry()) || "sw".equals(v.getLocale().getLanguage()));
        }
        /** Opens the phone's text-to-speech settings so a Swahili or Kenyan voice can be added. */
        @JavascriptInterface public void openVoiceSettings() {
            runOnUiThread(() -> {
                try { startActivity(new android.content.Intent("com.android.settings.TTS_SETTINGS")); }
                catch (Exception e) {
                    try { startActivity(new android.content.Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA)); } catch (Exception ignored) { }
                }
            });
        }
    }

    /**
     * Kenyan accent first. English: Kenyan English, then Swahili (an East African accent reading English),
     * then any English. Swahili: Kenyan Swahili, then any Swahili. Voices that work offline win ties.
     */
    private android.speech.tts.Voice bestVoice(String lang) {
        java.util.Set<android.speech.tts.Voice> all;
        try { all = tts.getVoices(); } catch (Exception e) { return null; }
        if (all == null) return null;
        String[][] order = "sw".equals(lang)
                ? new String[][]{{"sw", "KE"}, {"sw", ""}}
                : new String[][]{{"en", "KE"}, {"sw", "KE"}, {"sw", ""}, {"en", "TZ"}, {"en", "NG"}, {"en", "ZA"}, {"en", "GB"}, {"en", ""}};
        for (String[] want : order) {
            android.speech.tts.Voice best = null;
            for (android.speech.tts.Voice v : all) {
                Locale l = v.getLocale();
                if (!want[0].equals(l.getLanguage())) continue;
                if (!want[1].isEmpty() && !want[1].equals(l.getCountry())) continue;
                if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                if (best == null || (best.isNetworkConnectionRequired() && !v.isNetworkConnectionRequired()) || v.getQuality() > best.getQuality()) best = v;
            }
            if (best != null) return best;
        }
        return null;
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] results) {
        if (code == MIC_REQUEST && pendingMic != null) {
            if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) pendingMic.grant(pendingMic.getResources());
            else pendingMic.deny();
            pendingMic = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }
    @Override protected void onPause() { super.onPause(); if (tts != null) tts.stop(); }
    @Override protected void onDestroy() { if (tts != null) tts.shutdown(); web.destroy(); super.onDestroy(); }
}
