import {Component, ElementRef, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ArticleService} from "../../shared/services/article.service";
import {ArticleCardType} from "../../../types/article.type";
import {OwlOptions} from "ngx-owl-carousel-o";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {FormBuilder, Validators} from "@angular/forms";
import {RequestService} from "../../shared/services/request.service";
import {DefaultResponseType} from "../../../types/default-response.type";
import {HttpErrorResponse} from "@angular/common/http";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  selectedOptionInRequest: string = '';
  errorNoticeInRequestForm: boolean = false;

  topArticles: ArticleCardType[] = [];

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: true,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      }
    },
    nav: false
  };

  customOptionsReviews: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    navSpeed: 700,
    margin: 25,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      640: {
        items: 2
      },
      740: {
        items: 3
      }
    },
    nav: false
  };

  reviews = [
    {
      name: 'Станислав',
      image: 'review1.png',
      text: 'Спасибо огромное АйтиШторму за прекрасный блог с полезными статьями! Именно они и побудили меня углубиться в тему SMM и начать свою карьеру.'
    },
    {
      name: 'Алёна',
      image: 'review2.png',
      text: 'Обратилась в АйтиШторм за помощью копирайтера. Ни разу ещё не пожалела! Ребята действительно вкладывают душу в то, что делают, и каждый текст, который я получаю, с нетерпением хочется выложить в сеть.'
    },
    {
      name: 'Мария',
      image: 'review3.png',
      text: 'Команда АйтиШторма за такой короткий промежуток времени сделала невозможное: от простой фирмы по услуге продвижения выросла в мощный блог о важности личного бренда. Класс!'
    },
  ];

  @ViewChild('popupRequest') popupRequest!: TemplateRef<ElementRef>;
  dialogRequestRef: MatDialogRef<any> | null = null;
  @ViewChild('popupThanks') popupThanks!: TemplateRef<ElementRef>;
  dialogThanksRef: MatDialogRef<any> | null = null;


  requestForm = this.fb.group({
    service: ['', [Validators.required]],
    name: ['', [Validators.required, Validators.pattern(/^([А-ЯЁ][а-яё]+\s*){1,}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/)]],
    type: ['order']
  });

  get name() {
    return this.requestForm.get('name');
  }
  get phone() {
    return this.requestForm.get('phone');
  }


  constructor(private articleService: ArticleService,
              private dialog: MatDialog,
              private _snackBar: MatSnackBar,
              private fb: FormBuilder,
              private requestService: RequestService) {}

  ngOnInit(): void {
    this.articleService.getTopArticles()
      .subscribe((data: ArticleCardType[]) => {
        this.topArticles = data;
      });
  }

  toRequest(service: string) {
    this.dialogRequestRef = this.dialog.open(this.popupRequest);
    this.selectedOptionInRequest = service;  //чтобы нужный пункт был выбран
    this.requestForm.value.service = service;   //чтобы нужный пункт записался в форму
  }

  sendRequest() {
    // при клике на “Оставить заявку” происходит запрос на backend, если он успешен - скрыть форму и показать popupThanks
    //отправляется имя и номер телефона, type=order и поле service с названием услуги; в ответ - DefaultResponse
    // если в ответ от сервера пришла ошибка, под кнопкой - надпись-предупреждение

    if (this.requestForm.valid && this.requestForm.value.name && this.requestForm.value.phone && this.requestForm.value.service && this.requestForm.value.type) {
      this.requestService.sendRequest({
        name: this.requestForm.value.name,
        phone: '+7' + this.requestForm.value.phone,
        service: this.requestForm.value.service,
        type: this.requestForm.value.type
      })
        .subscribe({
          next: (data: DefaultResponseType) => {
            if (data.error) {
              this._snackBar.open(data.message);
              this.errorNoticeInRequestForm = true;
              throw new Error(data.message);
            }
            // если все хорошо - дива с ошибкой нет, закрывается и очищается форма, открывается ThanksPopup
            this.errorNoticeInRequestForm = false;
            this.closeRequestPopup();
            this.dialogThanksRef = this.dialog.open(this.popupThanks);
        },
          error: (errorResponse: HttpErrorResponse) => {
            if (errorResponse.error && errorResponse.error.message) {
              this._snackBar.open(errorResponse.error.message);
              this.errorNoticeInRequestForm = true;
            } else {
              this._snackBar.open('Ошибка сохранения');
              this.errorNoticeInRequestForm = true;
            }
          }
        }
        );
    }
  }

  closeRequestPopup() {
    this.requestForm.markAsPristine();   //чтобы можно было повторно отправить форму с новыми или теми же данными
    this.requestForm.markAsUntouched();  // при этом поля все равно отображаются как touched - почему?

    this.dialogRequestRef?.close();

    // нужно ли очищать форму?
    // this.nameInput = '';  //работает
    // this.phoneInput = ''; //работает
    // this.requestForm.reset();   //не дает отправить форму повторно без перезагрузки страницы
    // this.requestForm.value.name = '';  //очищает это поле
    // this.requestForm.value.phone = ''; //не очищает второе поле, если есть первое
  }

  closeThanksPopup() {
    this.dialogThanksRef?.close();
  }

}
