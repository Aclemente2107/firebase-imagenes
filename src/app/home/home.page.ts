import { Component } from '@angular/core';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

export interface MyData {
  name: string;
  filepath: string;
  size: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  task: AngularFireUploadTask;

  percentage: Observable<number>;

  snapshot: Observable<any>; //Ver los cambios de firebase

  UploadedFileURL: Observable<string>;

  images: Observable<MyData[]>;

  fileName: string;
  fileSize: number;

  isUploading: boolean;
  isUploaded: boolean;

  private imageCollection: AngularFirestoreCollection<MyData>;
  constructor(private storage: AngularFireStorage, private database: AngularFirestore) {
    this.isUploading = false;
    this.isUploaded = false;
    this.imageCollection = database.collection<MyData>('imagenes');
    this.images = this.imageCollection.valueChanges();
  }


  uploadFile(event: FileList) {


    const file = event.item(0)

    if (file.type.split('/')[0] !== 'image') {
      console.error('Tipo de archivo no soportado :( ')
      return;
    }

    this.isUploading = true;
    this.isUploaded = false;

    this.fileName = file.name;

    const path = `imagenes/${new Date().getTime()}_${file.name}`;

    const customMetadata = { app: 'Cargar imagenes en firebase' };

    const fileRef = this.storage.ref(path);

    this.task = this.storage.upload(path, file, { customMetadata });

    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(

      finalize(() => {
        this.UploadedFileURL = fileRef.getDownloadURL();

        this.UploadedFileURL.subscribe(resp => {
          this.addImagetoDB({
            name: file.name,
            filepath: resp,
            size: this.fileSize
          });
          this.isUploading = false;
          this.isUploaded = true;
        }, error => {
          //console.error(error);
        })
      }),
      tap(snap => {
        this.fileSize = snap.totalBytes;
      })
    )
  }

  addImagetoDB(image: MyData) {
    const id = this.database.createId();

    this.imageCollection.doc(id).set(image).then(resp => {
      //console.log(resp);
    }).catch(error => {
      //console.log("error " + error);
    });
  }


}
