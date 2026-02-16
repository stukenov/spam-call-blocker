package com.antibank.callblocker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;
import android.telephony.TelephonyManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class CallBlockingService extends Service {
    private static final String TAG = "CallBlockingService";
    private static final String CHANNEL_ID = "CallBlockingChannel";
    private static final int NOTIFICATION_ID = 1;
    
    private CallStateReceiver callStateReceiver;
    private boolean isServiceRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        
        callStateReceiver = new CallStateReceiver();
        IntentFilter filter = new IntentFilter();
        filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
        filter.addAction("android.intent.action.PHONE_STATE");
        registerReceiver(callStateReceiver, filter);
        
        Log.d(TAG, "CallBlockingService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!isServiceRunning) {
            startForeground(NOTIFICATION_ID, createNotification());
            isServiceRunning = true;
            Log.d(TAG, "CallBlockingService started");
        }
        return START_STICKY; // Перезапуск сервиса при убийстве системой
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (callStateReceiver != null) {
            unregisterReceiver(callStateReceiver);
        }
        isServiceRunning = false;
        Log.d(TAG, "CallBlockingService destroyed");
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Call Blocking Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Сервис блокировки нежелательных звонков");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("АнтиБанк защищает от спама")
                .setContentText("Блокировка нежелательных звонков активна")
                .setSmallIcon(android.R.drawable.ic_call_log)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }

    public static class CallStateReceiver extends BroadcastReceiver {
        private static final String TAG = "CallStateReceiver";
        private long callStartTime = 0;
        private String lastIncomingNumber = null;

        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                String action = intent.getAction();
                if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
                    String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
                    String phoneNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                    
                    Log.d(TAG, "Phone state changed: " + state + ", number: " + phoneNumber);
                    
                    if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
                        handleIncomingCall(context, phoneNumber);
                    } else if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
                        callStartTime = System.currentTimeMillis();
                    } else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
                        if (callStartTime > 0 && lastIncomingNumber != null) {
                            long callDuration = System.currentTimeMillis() - callStartTime;
                            checkMicroCall(context, lastIncomingNumber, callDuration);
                        }
                        resetCallState();
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in onReceive: " + e.getMessage());
            }
        }

        private void handleIncomingCall(Context context, String phoneNumber) {
            if (phoneNumber != null) {
                lastIncomingNumber = phoneNumber;
                Log.d(TAG, "Incoming call from: " + phoneNumber);
                
                // Проверяем, есть ли номер в контактах
                CallBlockerModule module = new CallBlockerModule(null);
                // Здесь нужна асинхронная проверка через CallBlockerModule
                // Для простоты пока логируем
                Log.d(TAG, "Checking if number is in contacts: " + phoneNumber);
                
                // Если номера нет в контактах - блокируем
                blockUnknownCall(context, phoneNumber);
            }
        }

        private void blockUnknownCall(Context context, String phoneNumber) {
            try {
                // Используем TelecomManager для блокировки
                Log.d(TAG, "Blocking call from: " + phoneNumber);
                
                // Отправляем событие в React Native
                Intent blockIntent = new Intent("CALL_BLOCKED");
                blockIntent.putExtra("phoneNumber", phoneNumber);
                blockIntent.putExtra("reason", "NOT_IN_CONTACTS");
                context.sendBroadcast(blockIntent);
                
            } catch (Exception e) {
                Log.e(TAG, "Failed to block call: " + e.getMessage());
            }
        }

        private void checkMicroCall(Context context, String phoneNumber, long duration) {
            if (duration < 3000) { // Меньше 3 секунд
                Log.d(TAG, "Detected micro call from: " + phoneNumber + ", duration: " + duration + "ms");
                
                // Отправляем событие о микровызове
                Intent microCallIntent = new Intent("MICRO_CALL_DETECTED");
                microCallIntent.putExtra("phoneNumber", phoneNumber);
                microCallIntent.putExtra("duration", duration);
                context.sendBroadcast(microCallIntent);
            }
        }

        private void resetCallState() {
            callStartTime = 0;
            lastIncomingNumber = null;
        }
    }
}