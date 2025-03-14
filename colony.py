import pandas as pd
import googlemaps
import os

# Cambiar el directorio actual
os.chdir('c:/Users/Giovanny/Documents/GitHub/DashboardSSS/js')

# Configuración de la API de Google Maps
gmaps = googlemaps.Client(key='AIzaSyBJh947BGTDrHMy7IFdodbm6PoAkPp79Hc')

# Diccionarios para almacenar la información adicional
municipios = {
    'VALLE DE SANTIAGO': '042',
    'JARAL DEL PROGRESO': '018',
    'SALVATIERRA': '028',
    'TARIMORO': '039',
    'SANTIAGO MARAVATIO': '036',
    'MOROLEON': '021',
    'ACAMBARO': '002',
    'MARAVATIO DE OCAMPO': '050',
    'YURIRIA': '046',
    'SANTA ANA MAYA': '076',
    'URIANGATO' : '041',
    'TARANDACUAO': '038'
}

centros = {
    'VALLE DE SANTIAGO': 'VS',
    'JARAL DEL PROGRESO': 'JP',
    'SALVATIERRA': 'SV',
    'TARIMORO': 'SV',
    'SANTIAGO MARAVATIO': 'SV',
    'MOROLEON': 'ML',
    'ACAMBARO': 'AC',
    'MARAVATIO DE OCAMPO': 'MT',
    'YURIRIA': 'ML',
    'SANTA ANA MAYA': 'ML',
    'URIANGATO' : 'ML',
    'TARANDACUAO': 'AC'
}

ages = {
    'VALLE DE SANTIAGO': '10G',
    'JARAL DEL PROGRESO': '10H',
    'SALVATIERRA': '10A',
    'TARIMORO': '10A',
    'SANTIAGO MARAVATIO': '10A',
    'MOROLEON': '10C',
    'URIANGATO' : '10C',
    'ACAMBARO': '10B',
    'MARAVATIO DE OCAMPO': '10F',
    'YURIRIA': '10C',
    'SANTA ANA MAYA': '10C',
    'TARANDACUAO': '10B'
}

# Leer el archivo de Excel
df1 = pd.read_excel('SegmentacionGeosCOPIA - copia.xlsx', sheet_name=0)
df2 = pd.read_excel('SegmentacionGeosCOPIA - copia.xlsx', sheet_name=1)

# Agregar columnas adicionales
for index, row in df1.iterrows():
    ciudad = row['Ciudad'].upper()
    nombre = row['Nombre']
    location = gmaps.geocode(ciudad + ', ' + nombre)
    if location:
        df1.loc[index, 'Edo'] = 'B' if ciudad != 'SANTIAGO MARAVATIO' else 'G'
        df1.loc[index, 'Munic'] = municipios[ciudad]
        df1.loc[index, 'Ambito'] = 'R' if location[0]['types'][0] == 'locality' else 'U'
        df1.loc[index, 'Age'] = ages[ciudad]
        df1.loc[index, 'Pob'] = ''
        df1.loc[index, 'Centro'] = centros[ciudad]

for index, row in df2.iterrows():
    ciudad = row['Ciudad'].upper()
    nombre = row['Nombre']
    location = gmaps.geocode(ciudad + ', ' + nombre)
    if location:
        df2.loc[index, 'Edo'] = 'B' if ciudad != 'SANTIAGO MARAVATIO' else 'G'
        df2.loc[index, 'Munic'] = municipios[ciudad]
        df2.loc[index, 'Ambito'] = 'R' if location[0]['types'][0] == 'locality' else 'U'
        df2.loc[index, 'Age'] = ages[ciudad]
        df2.loc[index, 'Pob'] = ''
        df2.loc[index, 'Centro'] = centros[ciudad]

# Combinar los datos de las dos hojas en una tercera hoja
combined_df = pd.concat([df1, df2], ignore_index=True)

# Guardar el resultado en un nuevo archivo de Excel
with pd.ExcelWriter('archivo_modificado.xlsx') as writer:
    combined_df.to_excel(writer, sheet_name='Hoja3', index=False)
    df1.to_excel(writer, sheet_name='Hoja1', index=False)
    df2.to_excel(writer, sheet_name='Hoja2', index=False)

print("El archivo ha sido procesado y guardado como 'archivo_modificado.xlsx'.")