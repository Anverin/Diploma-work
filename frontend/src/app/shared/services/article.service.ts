import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {ArticleCardType} from "../../../types/article.type";
import {ActiveParamsType} from "../../../types/active-params.type";
import {ArticleDetailType} from "../../../types/article-detail.type";
import {CommentsType} from "../../../types/comments.type";
import {DefaultResponseType} from "../../../types/default-response.type";
import {CommentActionsType} from "../../../types/comment-actions.type";

@Injectable({
  providedIn: 'root'
})

export class ArticleService {

  constructor(private http: HttpClient) { }

  getArticles(params: ActiveParamsType): Observable<{count: number, pages: number, items: ArticleCardType[]}> {
    return this.http.get<{count: number, pages: number, items: ArticleCardType[]}>(environment.api + 'articles', {params: params});
  }

  getTopArticles(): Observable<ArticleCardType[]> {
    return this.http.get<ArticleCardType[]>(environment.api + 'articles/top');
  }

  getArticle(url: string): Observable<ArticleDetailType> {
    return this.http.get<ArticleDetailType>(environment.api + 'articles/' + url);
  }

  getRelatedArticles(url: string): Observable<ArticleCardType[]> {
    return this.http.get<ArticleCardType[]>(environment.api + 'articles/related/' + url);
  }

  getComments(offset: number, id: string): Observable<CommentsType> {
    const params = new HttpParams().set('offset', offset).set('article', id);
    return this.http.get<CommentsType>(environment.api + 'comments', {params});
  }

  addComment(accessToken: string, text: string, article: string): Observable<DefaultResponseType> {
    return this.http.post<DefaultResponseType>(environment.api + 'comments', {text: text, article: article});
  }

  applyComment(accessToken: string, commentId: string, action: string): Observable<DefaultResponseType> {
    return this.http.post<DefaultResponseType>(environment.api + 'comments/' + commentId + '/apply-action', {action: action});
  }

  getAllCommentsUserActions(accessToken: string, articleId: string): Observable<CommentActionsType[] | DefaultResponseType> {
    const params = new HttpParams().set('articleId', articleId);
    return this.http.get<CommentActionsType[] | DefaultResponseType>(environment.api + 'comments/article-comment-actions', {params: params});
  }
}

// headers не нужны, т.к. есть auth-interceptor
