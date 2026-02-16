export interface Contact {
  name: string;
  number: string;
}

export interface CallEvent {
  phoneNumber: string;
  duration?: number;
  timestamp: number;
  reason: 'NOT_IN_CONTACTS' | 'MICRO_CALL' | 'USER_BLOCKED';
}

export interface CallBlockerModule {
  blockCall(phoneNumber: string): Promise<boolean>;
  isNumberInContacts(phoneNumber: string): Promise<boolean>;
  getAllContacts(): Promise<Contact[]>;
  isMicroCall(phoneNumber: string, callDuration: number): Promise<boolean>;
  startCallBlockingService(): Promise<boolean>;
  stopCallBlockingService(): Promise<boolean>;
}

declare module 'react-native' {
  interface NativeModulesStatic {
    CallBlockerModule: CallBlockerModule;
  }
}