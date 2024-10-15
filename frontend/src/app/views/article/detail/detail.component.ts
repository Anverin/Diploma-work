import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ArticleCardType} from "../../../../types/article.type";
import {ArticleService} from "../../../shared/services/article.service";
import {ActivatedRoute} from "@angular/router";
import {ArticleDetailType} from "../../../../types/article-detail.type";
import {environment} from "../../../../environments/environment";
import {CommentsType} from "../../../../types/comments.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {AuthService} from "../../../core/auth/auth.service";
import {FormBuilder, Validators} from "@angular/forms";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";
import {CommentType} from "../../../../types/comment.type";
import {CommentActionsType} from "../../../../types/comment-actions.type";
import {LoaderService} from "../../../shared/services/loader.service";


@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit, AfterViewInit {

  article!: ArticleDetailType;
  relatedArticles: ArticleCardType[] = [];
  comments!: CommentsType;
  partOfComments: CommentType[] = [];

  serverStaticPath = environment.serverStaticPath;

  @ViewChild('articleText') private articleText!: ElementRef;

  isLogged: boolean = false;
  accessToken: string = '';

  offset: number = 0;

  @ViewChild('like') like!: ElementRef;
  @ViewChild('dislike') dislike!: ElementRef;
  @ViewChild('violate') violate!: ElementRef;

  commentForm = this.fb.group({
    text: ['', [Validators.required]],
    article: [''],
  });

  get text() {
    return this.commentForm.get('text');
  }

  allUserActionsForComments: CommentActionsType[] = [];

  isLoader: boolean = false;

  constructor(private articleService: ArticleService,
              private activatedRoute: ActivatedRoute,
              private authService: AuthService,
              private fb: FormBuilder,
              private _snackBar: MatSnackBar,
              private loaderService: LoaderService) {

    this.isLogged = this.authService.getIsLoggedIn();

    if (this.authService.getTokens().accessToken) {
      this.accessToken = this.authService.getTokens().accessToken as string;
    }
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      this.articleService.getArticle(params['url'])
        .subscribe((data: ArticleDetailType) => {
          this.article = data;

          this.getComments();
          this.getAllCommentsUserActions();
        });
    });

    this.activatedRoute.params.subscribe(params => {
      this.articleService.getRelatedArticles(params['url'])
        .subscribe((data: ArticleCardType[]) => {
          this.relatedArticles = data;
        });
    });
  }

//отдельно, т.к. используется в ngOnInit + по клику на кнопку
  getComments() {
    this.articleService.getComments(0, this.article.id)
      .subscribe((data: CommentsType | null) => {
        if (data) {
          this.comments = data;
          this.partOfComments = data.comments.slice(0, 3);

          this.findCommentsWithAction(); //чтобы сразу покрасилась иконка
        }
      });
  }


  ngAfterViewInit(): void {
    //здесь + задержка, чтобы родитель для текста был уже точно отрисован, иначе не вставится
    const that = this;

    function makeContainerForArticleText() {
      if (that.article) {
        const articleTextWithTagsContainer = document.createElement('div');
        articleTextWithTagsContainer.classList.add('detail-body-inner-text');
        articleTextWithTagsContainer.innerHTML = that.article.text;
        that.articleText.nativeElement.appendChild(articleTextWithTagsContainer);
      } else {
        setTimeout(makeContainerForArticleText, 10);
      }
    }

    setTimeout(makeContainerForArticleText, 0);
  }

  getMoreComments() {
    this.loaderService.show();
    this.isLoader = true;
    //запрос комментов начиная с количества уже отображенных (сначала 3)
    this.articleService.getComments(this.partOfComments.length, this.article.id)
      .subscribe((comments: CommentsType | null) => {
        if (comments) {
          this.loaderService.hide();
          this.isLoader = false;
          //к обрезанному до 3 массиву уже отображенных добавятся пришедшие в запросе 10 (будет 13, затем 23)
          this.partOfComments.push(...comments.comments);

          this.findCommentsWithAction();  //проверить, какими отобразить активные svg
        }
      });

    //ЛИБО запросить начиная с количества уже запрошенных (10)
    // this.articleService.getComments(this.comments.comments.length, this.article.id)
    // .subscribe((comments: CommentsType | null) => {
    // if (comments) {
    //к уже запрошенным добавятся запрошенные сейчас
    // this.comments.comments.push(...comments.comments);
    //отображаемые будут: все пришедшие с сервера, обрезанные от своего 0 до количества уже отображенных + 10, будет 3+х10
    // this.partOfComments = this.comments.comments.slice(0, (this.partOfComments.length + 10));
    // this.findCommentsWithAction();
    // }
    // });
  }

  addComment(): void {
    if (this.commentForm.valid && this.commentForm.value.text && this.article.id) {
      this.articleService.addComment(this.accessToken, this.commentForm.value.text, this.article.id)
        .subscribe({
            next: (data: DefaultResponseType) => {
              if (data.error) {
                this._snackBar.open(data.message);
                throw new Error(data.message);
              } else {
                this.articleService.getComments(0, this.article.id)
                  .subscribe((comments: CommentsType | null) => {
                    if (comments) {
                      this.partOfComments.unshift(comments.comments[0]);
                    }
                    // очистить форму
                    this.commentForm.reset();
                  });
              }
            },
            error: (errorResponse: HttpErrorResponse) => {
              if (errorResponse.error && errorResponse.error.message) {
                this._snackBar.open(errorResponse.error.message);
              } else {
                this._snackBar.open('Ошибка отправки комментария');
              }
            }
          }
        );
    }
  }


  likeComment(commentId: string): void {
    this.articleService.applyComment(this.accessToken, commentId, 'like')
      .subscribe({
        next: (data: DefaultResponseType) => {
          if (data.error) {
            this._snackBar.open(data.message);
            throw new Error(data.message);
          } else {
            this._snackBar.open('Ваш голос учтён');
            // изменить состояние иконки сразу по клику, изменив isLiked
            const foundComment = this.partOfComments.find(item => item.id === commentId);
            if (foundComment) {
              foundComment.isLiked = !foundComment.isLiked;  //красится иконка в противоположный цвет

              if (foundComment.isLiked) {  //если НОВОЕ состояние liked - прибавить 1
                foundComment.likesCount = foundComment.likesCount + 1;
              } else {
                foundComment.likesCount = foundComment.likesCount - 1;
              }

              if (foundComment.isDisliked) { //если при этом было true свойство isDisliked - убрать дизлайк
                foundComment.isDisliked = !foundComment.isDisliked;
                foundComment.dislikesCount = foundComment.dislikesCount - 1;
              }
            }
          }
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this._snackBar.open(errorResponse.error.message);
          } else {
            this._snackBar.open('Ошибка при голосовании');
          }
        }
      });
  }

  dislikeComment(commentId: string): void {
    this.articleService.applyComment(this.accessToken, commentId, 'dislike')
      .subscribe({
        next: (data: DefaultResponseType) => {
          if (data.error) {
            this._snackBar.open(data.message);
            throw new Error(data.message);
          } else {
            this._snackBar.open('Ваш голос учтён');

            // изменить состояние иконки сразу по клику, изменив isDisliked
            const foundComment = this.partOfComments.find(item => item.id === commentId);
            if (foundComment) {
              foundComment.isDisliked = !foundComment.isDisliked;

              if (foundComment.isDisliked) {  //если НОВОЕ состояние disliked - прибавить 1
                foundComment.dislikesCount = foundComment.dislikesCount + 1;
              } else {
                foundComment.dislikesCount = foundComment.dislikesCount - 1;
              }

              if (foundComment.isLiked) { //если при этом было true свойство isLiked - убрать лайк
                foundComment.isLiked = !foundComment.isLiked;
                foundComment.likesCount = foundComment.likesCount - 1;
              }
            }
          }
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this._snackBar.open(errorResponse.error.message);
          } else {
            this._snackBar.open('Ошибка при голосовании');
          }
        }
      });
  }

  violateComment(commentId: string): void {
    this.articleService.applyComment(this.accessToken, commentId, 'violate')
      .subscribe({
        next: (data: DefaultResponseType) => {
          if (data.error) {
            this._snackBar.open(data.message);
            throw new Error(data.message);
          } else {
            this._snackBar.open('Жалоба отправлена');

            // при повторном клике - запрос не отправляется (?)  этот код избыточен (?)
            this.violate.nativeElement.addEventListener('click', (event: any) => {
              event.preventDefault(); //не требуется, бэкенд и так не пропускает повторные запросы
              this._snackBar.open('Жалоба уже отправлена'); //вместо этого выводится сообщение с бэкенда "Это действие уже применено к комментарию"
            });
          }
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this._snackBar.open(errorResponse.error.message);
            // this._snackBar.open('Жалоба уже отправлена');  //сообщение по ТЗ
          } else {
            this._snackBar.open('Ошибка при отправке жалобы');
          }
        }
      });
  }

  getAllCommentsUserActions(): void {
    this.articleService.getAllCommentsUserActions(this.accessToken, this.article.id)
      .subscribe({
        next: (data: CommentActionsType[] | DefaultResponseType) => {
          if ((data as DefaultResponseType).error) {
            this._snackBar.open((data as DefaultResponseType).message);
            throw new Error((data as DefaultResponseType).message);
          }
          this.allUserActionsForComments = data as CommentActionsType[];

          this.findCommentsWithAction();
        },
        error: (errorResponse: HttpErrorResponse) => {
          if (errorResponse.error && errorResponse.error.message) {
            this._snackBar.open(errorResponse.error.message);
          } else {
            this._snackBar.open('Ошибка при запросе действий');
          }
        }
      });
  }

  findCommentsWithAction(): void {
    //сравнить два массива (всех [отображаемых - this.partOfComments.length] комментов и на которые есть реакции)
    for (let i = 0; i < this.partOfComments.length; i++) {
      for (let j = 0; j < this.allUserActionsForComments.length; j++) {
        //если элемент массива совпадает с имеющим реакцию
        if (this.partOfComments[i].id === this.allUserActionsForComments[j].comment) {
            //и эта реакция - лайк
          if (this.allUserActionsForComments[j].action === 'like') {
            //поменять отображаемому комменту свойство лайкнутости
            this.partOfComments[i].isLiked = true;
          } else if (this.allUserActionsForComments[j].action === 'dislike') {
            this.partOfComments[i].isDisliked = true;
          }
        }
      }
    }
  }
}
