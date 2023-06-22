import {FieldPath, QueryConstraint, where, WhereFilterOp} from "@angular/fire/firestore"

export function lazyWhere(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: unknown): Promise<QueryConstraint>{
    // return import("@angular/fire/firestore").then(({where})=>{
        return new Promise((resolve)=>{
            resolve(where(fieldPath, opStr, value));

        })

    // })
}