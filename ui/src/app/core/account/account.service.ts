import { HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, catchError, EMPTY, map, Observable } from "rxjs";
import zxcvbn, { IZXCVBNResult } from "zxcvbn-typescript";
import { ApiService } from "../api.service";
import { Account } from "./account";

@Injectable({
    providedIn: 'root',
})
export class AccountService{
    constructor(
        private $api: ApiService,
    ){}

    updateAccount(account: {id: number, AccountUserName: string, AccountPassword: string, AccountUrl: string}){
        return this.$api.put('/account/update', account);
    }

    addAccount(form: {website: string, username: string, password: string}){
        let formAux = {
            username: form.username,
            password: form.password,
            url: form.website
        }
        return this.$api.post('/account/add', formAux);
    }

    deleteAccount( form: {id: number} ){
        return this.$api.delete('/account/delete', {body: form});
    }

    getValidUrl(url: string){
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url =  'http://' + url;
        }
        url += "/favicon.ico";
        return url;
    }

    getValidImgUrl(account: Account){
        let queryParams = new HttpParams();
        account.validImgUrl = "assets/defaultWebIcon.png";
        queryParams = queryParams.append("url", this.getValidUrl(account.AccountUrl));
        this.$api.get("/account/get-url-icon", {params: queryParams, responseType: 'blob'})
        .subscribe(
            (result) => {
                if( result.type === "image/png" ) account.validImgUrl = this.getValidUrl(account.AccountUrl);
            }
        )
    }

    computePasswordStrength(password: string): IZXCVBNResult {
        return zxcvbn(password);
    }

    getAccounts(): Observable<Account[]> {
        const self = this;
        return this.$api.get("/account/getAll").pipe(
            map( (resp: {accounts: Account[]}) => {
                resp.accounts.forEach( (account: Account) => {
                    account.showPassword = false;
                    account.editable = false;
                    account.editLoading = false;
                    account.passwordStrength = this.computePasswordStrength(account.AccountPassword);

                    this.getValidImgUrl(account);
                    
                    return account;
                })
                return resp.accounts
            }),
        );
    }
}