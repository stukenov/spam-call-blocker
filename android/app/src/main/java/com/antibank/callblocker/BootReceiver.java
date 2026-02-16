package com.antibank.callblocker;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "call_blocker_settings";
    private static final String KEY_IS_ENABLED = "isEnabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(action)) {
            
            Log.d(TAG, "Device boot completed or app updated");
            
            // Проверяем, была ли включена блокировка
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(KEY_IS_ENABLED, false);
            
            if (isEnabled) {
                Log.d(TAG, "Auto-starting call blocking service");
                startCallBlockingService(context);
            }
        }
    }

    private void startCallBlockingService(Context context) {
        try {
            Intent serviceIntent = new Intent(context, CallBlockingService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.d(TAG, "Call blocking service started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start call blocking service: " + e.getMessage());
        }
    }
}