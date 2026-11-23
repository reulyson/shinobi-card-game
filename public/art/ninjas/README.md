# Arte local — Ninjas

Uma pasta por ficha, nome = `id` do ninja em `src/data/ninjas.ts`.

```
hinata_hyuga/
  gennin.png      # retrato transparente (obrigatório quando migrar deste ninja)
  chuunin.png
  jounnin.png
  gennin-popout.png   # opcional — só se o recorte pop-out for diferente
```

URLs no jogo: `/art/ninjas/<id>/<patente>.png`  
Helper: `ninjaLocalImageUrls(id)` em `src/data/ninjaArt.ts`.

Enquanto o arquivo não existir, mantenha `imageUrls` apontando para a Narutopedia em `ninjas.ts`.