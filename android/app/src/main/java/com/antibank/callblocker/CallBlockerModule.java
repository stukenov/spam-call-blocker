package com.antibank.callblocker;

import android.content.Context;
import android.content.Intent;
import android.telecom.TelecomManager;
import android.telephony.TelephonyManager;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;

import java.lang.reflect.Method;
import java.util.HashSet;
import java.util.Set;

public class CallBlockerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "CallBlockerModule";
    private ReactApplicationContext reactContext;
    private TelecomManager telecomManager;
    private TelephonyManager telephonyManager;

    public CallBlockerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.telecomManager = (TelecomManager) reactContext.getSystemService(Context.TELECOM_SERVICE);
        this.telephonyManager = (TelephonyManager) reactContext.getSystemService(Context.TELEPHONY_SERVICE);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void blockCall(String phoneNumber, Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                // Android 9+ method
                if (telecomManager != null) {
                    telecomManager.endCall();
                    promise.resolve(true);
                }
            } else {
                // Legacy method using reflection
                try {
                    Class<?> telephonyClass = Class.forName("com.android.internal.telephony.ITelephony");
                    Method endCallMethod = telephonyClass.getMethod("endCall");
                    
                    Object telephonyObject = telephonyManager.getClass().getMethod("getITelephony").invoke(telephonyManager);
                    endCallMethod.invoke(telephonyObject);
                    promise.resolve(true);
                } catch (Exception e) {
                    promise.reject("BLOCK_CALL_ERROR", "Failed to block call: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            promise.reject("BLOCK_CALL_ERROR", "Failed to block call: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isNumberInContacts(String phoneNumber, Promise promise) {
        try {
            if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_CONTACTS) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.resolve(false);
                return;
            }

            String normalizedNumber = normalizePhoneNumber(phoneNumber);
            
            Cursor cursor = reactContext.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{ContactsContract.CommonDataKinds.Phone.NUMBER},
                null, null, null
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String contactNumber = cursor.getString(cursor.getColumnIndex(
                        ContactsContract.CommonDataKinds.Phone.NUMBER));
                    if (contactNumber != null && 
                        normalizePhoneNumber(contactNumber).equals(normalizedNumber)) {
                        cursor.close();
                        promise.resolve(true);
                        return;
                    }
                }
                cursor.close();
            }
            promise.resolve(false);
        } catch (Exception e) {
            promise.reject("CONTACTS_CHECK_ERROR", "Failed to check contacts: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getAllContacts(Promise promise) {
        try {
            if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.READ_CONTACTS) 
                != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Contacts permission not granted");
                return;
            }

            WritableArray contacts = Arguments.createArray();
            Set<String> addedNumbers = new HashSet<>();

            Cursor cursor = reactContext.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null, null, null
            );

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String name = cursor.getString(cursor.getColumnIndex(
                        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                    String number = cursor.getString(cursor.getColumnIndex(
                        ContactsContract.CommonDataKinds.Phone.NUMBER));
                    
                    if (number != null && !addedNumbers.contains(number)) {
                        WritableMap contact = Arguments.createMap();
                        contact.putString("name", name != null ? name : "Unknown");
                        contact.putString("number", number);
                        contacts.pushMap(contact);
                        addedNumbers.add(number);
                    }
                }
                cursor.close();
            }
            
            promise.resolve(contacts);
        } catch (Exception e) {
            promise.reject("GET_CONTACTS_ERROR", "Failed to get contacts: " + e.getMessage());
        }
    }

    @ReactMethod
    public void isMicroCall(String phoneNumber, int callDuration, Promise promise) {
        // Микровызов считается если длительность меньше 3 секунд
        boolean isMicro = callDuration < 3000; // 3 секунды в миллисекундах
        promise.resolve(isMicro);
    }

    private String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null) return "";
        // Удаляем все символы кроме цифр и +
        return phoneNumber.replaceAll("[^\\d+]", "");
    }

    @ReactMethod
    public void startCallBlockingService(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, CallBlockingService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(serviceIntent);
            } else {
                reactContext.startService(serviceIntent);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SERVICE_START_ERROR", "Failed to start service: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopCallBlockingService(Promise promise) {
        try {
            Intent serviceIntent = new Intent(reactContext, CallBlockingService.class);
            reactContext.stopService(serviceIntent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SERVICE_STOP_ERROR", "Failed to stop service: " + e.getMessage());
        }
    }
}