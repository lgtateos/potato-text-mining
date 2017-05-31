
#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      Makiko Shukunobe
#
# Created:     24/02/2015
# Modified by:  Laura Tateosian 2017
# Copyright:   (c) mshukun 2015
# Licence:     <your licence>
#-------------------------------------------------------------------------------

import os, csv, sqlite3, codecs
#from PyPDF2 import PdfFileReader, PdfFileWriter
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfpage import PDFPage
from cStringIO import StringIO
import traceback


def createCSV():
    inDir = "C:/Users/lgtateos/Documents/ccurrentProjects/NLP/clavinPDF/pReports/US Patent Reports From LP/"
    outfile = inDir + "/out/pdfdb.csv"
    header = ["YEAR", "MEDIA", "FILE_DATE", "FILE_NAME", "FILE_FORMAT"]
    openfile = open(outfile, 'wb')
    writer = csv.writer(openfile)
    writer.writerow(header)

    for root, dirs, files in os.walk(inDir):

        for f in files:
            writeToCsv = []
            fullpath = os.path.join(root, f).encode('utf-8')
            pathSplit = fullpath.split('\\')
            findext = pathSplit[3].split('.')
            writeToCsv = [pathSplit[1], pathSplit[2], pathSplit[3][:6], pathSplit[3], findext[len(findext) - 1].upper()]
            print writeToCsv
            writer.writerow(writeToCsv)

    openfile.close()
    del writer


def createDBTableAndInsertDataFromCSV(fieldsAndType, fields, tableName, incsv):
    """ Creates a database table and insert values from a CSV table.
        @param fieldAndType: A list containing field names with field types (e.g.
        ["address TEXT", "city TEXT"]).
        @param fields: A list containing field names (e.g. ["address", "city"].
        @param tableName: A name of newly creating table.
        @param incsv: input CSV file path. The CSV file has to have a header.
    """

    # Create string fields
    fieldsAndTypeStr = ", ".join(fieldsAndType)
    fieldsStr =  ", ".join(fields)

    # Drop table if the table exists
    cur.executescript('DROP TABLE if exists ' + tableName)
    # Create a db table
    cur.execute("CREATE TABLE {0}({1});".format(tableName, fieldsAndTypeStr))

    # Read in CSV
    inf = open(incsv, 'rb')
    data = csv.reader(inf)
    next(data, None) # Skip header

    # Create "?" string for values
    tempVarList = []
    for x in range(len(fields)):
        tempVarList.append("?")
    var = ",".join(tempVarList)
    print "INSERT INTO {0}({1}) VALUES ({2})".format(tableName, fieldsStr, var)

    # Insert values into the database table
    cur.executemany("INSERT INTO {0}({1}) VALUES ({2})".format(tableName, fieldsStr, var), data)
    con.commit()

    inf.close()
    print tableName, ": COMPLETE"

#PyPDF2 test
"""def pdfToText():
    #infile = "C:/Users/mshukun/Documents/NLP/references books/chapter 5.pdf"
    infile = "C:/Users/mshukun/Documents/NLP/PDF/pdfs4Sarah/1991/NY_Times/130101 Cadets Charge Abuse.pdf"
    input1 = PdfFileReader(open(infile, 'rb'))
    print input1.getPage(0).extractText()
    print input1.getPage(0).getContents()
    print input1"""



def convert_pdf_to_txt(path, encodeType):

    rsrcmgr = PDFResourceManager()
    retstr = StringIO()
    codec = encodeType
    #codec = 'ISO-8859-1'
    laparams = LAParams()
    device = TextConverter(rsrcmgr, retstr, codec=codec, laparams=laparams)
    fp = file(path, 'rb')
    interpreter = PDFPageInterpreter(rsrcmgr, device)
    password = ""
    maxpages = 0
    caching = True
    pagenos=set()

    for page in PDFPage.get_pages(fp, pagenos, maxpages=maxpages, password=password,caching=caching, check_extractable=True):
        interpreter.process_page(page)


    text = retstr.getvalue()

    fp.close()
    device.close()
    retstr.close()

    return text


def write2Text(inDir, outDir, errorOut):
    # https://piazza.com/class/idbzjic4hs1hw?cid=505 notes about encode method
    # inDir = "C:/Users/mshukun/Documents/NLP/PDF/pdfs4Sarah/2012"
    # https://docs.python.org/2/library/stdtypes.html

    isoEncode = []

    for root, dirs, files in os.walk(inDir):
        count = 0
        for f in files:
            fullpath = os.path.join(root, f)
            print "------------------------------------------------------------"
            print "PDF: ", fullpath
            pathSplit = os.path.splitext(fullpath)
            print "pathSplit: ", len(pathSplit)
            fileName =pathSplit[0]


            # Get file extension
            fileExt = pathSplit[1].lower()
            print "Text file name: ", fileName

            if fileExt == ".pdf":
                # CALL - Convert PDF to Text using ISO-8859-1 encode
                # NOTE: Encode UTF-8 gives UnicodeEncode error for some PDF files,
                #       but it seems encode ISO-8859-1 doesn't arise errors.
                #       So, instead finding out each file's encode type and apply
                #       ISO-8859-1 and later apply UTF-8.
                try:
                    text = convert_pdf_to_txt(fullpath, 'ISO-8859-1') # ISO-8859-1 encode
                    #text.decode('ISO-8859-1').encode('UTF-8') # Decode ISO-8859-1 and encode UTF-8
                    text.decode('ISO-8859-1').encode('us-ascii','replace')
                    outfilepath = os.path.join(outDir, fileName + '.txt')
                    with open(outfilepath, 'wb') as outText:
                            outText.write(text)
                    count += 1

                except:
                    print "Error"
                    print fullpath, "\n\n"
                    print traceback.print_exc()

                    #text.encode(encoding='ISO-8859-1', errors='strict')
                    isoEncode.append(fullpath)
            else:
                isoEncode.append(fullpath)
        print "Number of PDF files: ", len(files), " Conversion complete count: ", count
        if len(files) - count != 0:
            print "!!!MISSING Files!!!: ", len(files) - count

        print "*************************************************************\n\n"

        if len(isoEncode) != 0:
            with open(errorOut, 'wb') as errorfp:
                for i in isoEncode:
                    errorfp.write(i+"\n\n")





if __name__ == "__main__":

    """createCSV()

    dbfile = "C:/Users/mshukun/Documents/NLP/PDF/out/pdfs4Sarah.db"

    con = sqlite3.connect(dbfile)
    cur = con.cursor()

    fieldsAndType = ["YEAR TEXT", "MEDIA TEXT", "FILE_DATE TEXT", "FILE_NAME TEXT", "FILE_FORMAT TEXT"]
    fields = ["YEAR", "MEDIA", "FILE_DATE", "FILE_NAME", "FILE_FORMAT"]
    tableName = "PDFs"
    incsv = "C:/Users/mshukun/Documents/NLP/PDF/out/pdfdb.csv"

    # CALL
    createDBTableAndInsertDataFromCSV(fieldsAndType, fields, tableName, incsv)

    del con, cur"""


    #tex = convert_pdf_to_txt(dallas_morning_news)
    #print tex

    """outTxt = "C:/Users/mshukun/Documents/NLP/PDF/out/test.txt"
    with open(outTxt, 'wb') as outf:
        outf.write(tex)"""
    #infile = "C:/Users/mshukun/Documents/NLP/PDF/pdfs4Sarah/1994/The_Washington_Post/040401 Adm._Kelso's_Decision_The_Washington_Post_Fe.pdf"
    #text = convert_pdf_to_txt(infile, 'ISO-8859-1')
    #print text
   # write2Text()

    """inDir = "C:/Users/mshukun/Documents/NLP/PDF/pdfs4Sarah/"
    outDir = "C:/Users/mshukun/Documents/NLP/PDF/out/texts/"
    errorOut = "C:/Users/mshukun/Documents/NLP/PDF/out/pdfEncodeError.txt"
    write2TextVer2(inDir, outDir, errorOut)
    print "done"""

    indir = 'C:/Users/lgtateos/Documents/ccurrentProjects/NLP/clavinPDF/pReports/US Patent Reports From LP/'  ### Other users will need to change me
    outdir = indir + "/textFiles/"
    errorout = indir + 'pdfEncodeError.txt'
    write2Text(indir, outdir, errorout)


