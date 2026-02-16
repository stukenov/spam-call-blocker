package com.antibank.callblocker;

import android.os.Build;
import android.telecom.Call;
import android.telecom.CallScreeningService;
import android.util.Log;
import android.content.Intent;
import androidx.annotation.RequiresApi;

@RequiresApi(api = Build.VERSION_CODES.N)
public class CallScreeningService extends android.telecom.CallScreeningService {
    private static final String TAG = "CallScreeningService";

    @Override
    public void onScreenCall(Call.Details callDetails) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return;
        }

        String phoneNumber = null;
        if (callDetails.getHandle() != null) {
            phoneNumber = callDetails.getHandle().getSchemeSpecificPart();
        }

        Log.d(TAG, "Screening call from: " + phoneNumber);

        if (phoneNumber != null && shouldBlockCall(phoneNumber)) {
            Log.d(TAG, "Blocking call from: " + phoneNumber);
            
            // Блокируем звонок и отправляем в голосовую почту
            respondToCall(callDetails, new CallResponse.Builder()
                    .setDisallowCall(true)
                    .setRejectCall(true)
                    .setSkipCallLog(false)
                    .setSkipNotification(false)
                    .build());
                    
            // Отправляем событие о блокировке
            Intent blockIntent = new Intent("CALL_BLOCKED");
            blockIntent.putExtra("phoneNumber", phoneNumber);
            blockIntent.putExtra("reason", "SCREENING_SERVICE");
            sendBroadcast(blockIntent);
        } else {
            // Разрешаем звонок
            respondToCall(callDetails, new CallResponse.Builder()
                    .setDisallowCall(false)
                    .setRejectCall(false)
                    .build());
        }
    }

    private boolean shouldBlockCall(String phoneNumber) {
        try {
            // Здесь можно добавить логику проверки номера
            // Пока простая заглушка
            CallBlockerModule module = new CallBlockerModule(null);
            // В реальной реализации нужно асинхронно проверить контакты
            // Для простоты пока возвращаем false
            return false;
        } catch (Exception e) {
            Log.e(TAG, "Error checking if should block call: " + e.getMessage());
            return false;
        }
    }
}