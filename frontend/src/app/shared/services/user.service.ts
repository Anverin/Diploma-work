import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {UserType} from "../../../types/user.type";
import {DefaultResponseType} from "../../../types/default-response.type";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getUserInfo(accessToken: string): Observable<UserType | DefaultResponseType> {
      return this.http.get<UserType | DefaultResponseType>(environment.userDataPath, {headers: new HttpHeaders({'x-auth': accessToken})});
       }
}
