export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | KZ Z
        | Json[]

export interface Database {
    publickq: {
        Tables: {
            // Add your tables here
        }
        Views: {
            // Add your views here
        }
        Functions: {
            // Add your functions here
        }
        Enums: {
            // Add your enums here
        }
    }
}
